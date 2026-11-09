import { ATIVAS } from '../domain/constantes.js';
import { sobrepoe } from '../domain/periodo.js';

/**
 * Banco EM MEMÓRIA com a mesma interface do repositório MongoDB.
 * Usado nos testes automatizados (rápidos, sem rede). Cada operação cede o controle ao event loop
 * (setImmediate) para que requisições simultâneas realmente se intercalem, como num banco de verdade.
 */
export function criarRepositoriosMemoria() {
  const colecoes = { usuarios: [], recursos: [], manutencoes: [], reservas: [], auditoria: [], tentativas: [] };
  const bloqueiosMap = new Map();
  const seq = {};
  const proximoId = (nome) => (seq[nome] = (seq[nome] ?? 0) + 1);
  const ceder = () => new Promise((resolve) => setImmediate(resolve));
  const copia = (x) => (x === undefined || x === null ? x : structuredClone(x));

  async function inserir(nome, doc) {
    await ceder();
    const novo = { _id: proximoId(nome), ...structuredClone(doc) };
    colecoes[nome].push(novo);
    return copia(novo);
  }
  async function buscar(nome, id) {
    await ceder();
    return copia(colecoes[nome].find((d) => d._id === id) ?? null);
  }
  const ativa = (r) => ATIVAS.includes(r.estado);

  return {
    driver: 'memoria',

    usuarios: {
      inserir: (doc) => inserir('usuarios', doc),
      buscarPorEmail: async (email) => { await ceder(); return copia(colecoes.usuarios.find((u) => u.email === email) ?? null); },
      buscarPorId: (id) => buscar('usuarios', id),
      contar: async () => { await ceder(); return colecoes.usuarios.length; },
    },

    recursos: {
      inserir: (doc) => inserir('recursos', doc),
      buscar: (id) => buscar('recursos', id),
      listar: async () => { await ceder(); return copia([...colecoes.recursos].sort((a, b) => a._id - b._id)); },
    },

    manutencoes: {
      inserir: (doc) => inserir('manutencoes', doc),
      listarPorRecurso: async (recursoId) => {
        await ceder();
        return copia(colecoes.manutencoes.filter((m) => m.recursoId === recursoId).sort((a, b) => a.inicio - b.inicio));
      },
      existeSobreposicao: async (recursoId, ini, fim) => {
        await ceder();
        return colecoes.manutencoes.some((m) => m.recursoId === recursoId && sobrepoe(ini, fim, m.inicio, m.fim));
      },
      noPeriodo: async (recursoId, ini, fim) => {
        await ceder();
        return copia(colecoes.manutencoes.filter((m) => m.recursoId === recursoId && sobrepoe(ini, fim, m.inicio, m.fim)));
      },
      emAndamento: async (agora) => {
        await ceder();
        return [...new Set(colecoes.manutencoes.filter((m) => m.inicio <= agora && agora < m.fim).map((m) => m.recursoId))];
      },
    },

    reservas: {
      inserir: (doc) => inserir('reservas', doc),
      buscar: (id) => buscar('reservas', id),
      remover: async (id) => { await ceder(); const i = colecoes.reservas.findIndex((r) => r._id === id); if (i >= 0) colecoes.reservas.splice(i, 1); },
      listar: async ({ solicitanteId } = {}) => {
        await ceder();
        return copia(colecoes.reservas
          .filter((r) => solicitanteId === undefined || r.solicitanteId === solicitanteId)
          .sort((a, b) => a.inicio - b.inicio));
      },
      /** Atualização condicional (compare-and-set): só aplica se o documento ainda satisfaz `condicao`. */
      atualizar: async (id, alteracoes, condicao = {}) => {
        await ceder();
        const r = colecoes.reservas.find((d) => d._id === id);
        if (!r) return false;
        for (const [k, v] of Object.entries(condicao)) if (r[k] !== v) return false;
        Object.assign(r, structuredClone(alteracoes));
        return true;
      },
      existeSobreposicaoRecurso: async (recursoId, ini, fim, ignorarId) => {
        await ceder();
        return colecoes.reservas.some((r) => r.recursoId === recursoId && ativa(r) && r._id !== ignorarId && sobrepoe(ini, fim, r.inicio, r.fim));
      },
      existeSobreposicaoAgenda: async (solicitanteId, ini, fim, ignorarId) => {
        await ceder();
        return colecoes.reservas.some((r) => r.solicitanteId === solicitanteId && ativa(r) && r._id !== ignorarId && sobrepoe(ini, fim, r.inicio, r.fim));
      },
      ativasNoPeriodo: async (recursoId, ini, fim) => {
        await ceder();
        return copia(colecoes.reservas.filter((r) => r.recursoId === recursoId && ativa(r) && sobrepoe(ini, fim, r.inicio, r.fim)));
      },
      comUsoNoPeriodo: async (estados, ini, fim) => {
        await ceder();
        return copia(colecoes.reservas.filter((r) => estados.includes(r.estado) && sobrepoe(ini, fim, r.inicio, r.fim)));
      },
    },

    auditoria: {
      inserir: (doc) => inserir('auditoria', doc),
      listarPorReserva: async (reservaId) => {
        await ceder();
        return copia(colecoes.auditoria.filter((a) => a.reservaId === reservaId).sort((a, b) => a.instante - b.instante || a._id - b._id));
      },
    },

    tentativas: {
      inserir: (doc) => inserir('tentativas', doc),
      contar: async (de, ate) => {
        await ceder();
        return colecoes.tentativas.filter((t) => t.inicioSolicitado >= de && t.inicioSolicitado < ate).length;
      },
    },

    bloqueios: {
      adquirir: async (chave, dono, ate, agora) => {
        await ceder();
        const atual = bloqueiosMap.get(chave);
        if (atual && atual.ate >= agora) return false;
        bloqueiosMap.set(chave, { dono, ate });
        return true;
      },
      liberar: async (chave, dono) => {
        await ceder();
        if (bloqueiosMap.get(chave)?.dono === dono) bloqueiosMap.delete(chave);
      },
    },

    contarTudo: () => Object.fromEntries(Object.entries(colecoes).map(([k, v]) => [k, v.length])),
    fechar: async () => {},
  };
}
