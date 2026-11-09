import { ApiError } from '../util/api-error.js';
import { validarPeriodo } from '../domain/periodo.js';
import { verificarTransicao } from '../domain/politica-transicao.js';
import { comBloqueio } from '../domain/bloqueio.js';
import { auditoriaDto, reservaDto } from '../entity/mapeadores.js';

export function criarReservaService({ reservas, recursos, manutencoes, auditoria, tentativas, bloqueios, relogio }) {
  const bloquear = (chaves, fn) => comBloqueio(bloqueios, relogio, chaves, fn);

  async function exigirRecurso(id) {
    const r = await recursos.buscar(id);
    if (!r) throw new ApiError(404, 'Recurso inexistente.');
    return r;
  }
  async function exigirReserva(id) {
    const r = await reservas.buscar(id);
    if (!r) throw new ApiError(404, 'Reserva inexistente.');
    return r;
  }
  const restritoDe = async (reserva) => !!(await recursos.buscar(reserva.recursoId))?.restrito;

  async function registrarAuditoria(reserva, usuario, anterior, novo, motivo) {
    return auditoria.inserir({
      reservaId: reserva._id,
      usuarioId: usuario.id,
      usuarioNome: usuario.nome,
      instante: relogio.agora(),
      estadoAnterior: anterior,
      estadoNovo: novo,
      motivo,
    });
  }

  async function recusarPorConflito(usuario, recursoId, inicio, fim, mensagem) {
    await tentativas.inserir({
      recursoId, usuarioId: usuario.id, inicioSolicitado: inicio, fimSolicitado: fim, criadoEm: relogio.agora(),
    });
    throw new ApiError(409, mensagem);
  }

  /** Checagens de sobreposição (recurso em manutenção, recurso ocupado, agenda do solicitante). Roda dentro do bloqueio. */
  async function garantirLivre(usuario, recursoId, inicio, fim, ignorarId) {
    if (await manutencoes.existeSobreposicao(recursoId, inicio, fim)) {
      throw new ApiError(409, 'O recurso está em manutenção no período solicitado.');
    }
    if (await reservas.existeSobreposicaoRecurso(recursoId, inicio, fim, ignorarId)) {
      await recusarPorConflito(usuario, recursoId, inicio, fim, 'Já existe uma reserva para este recurso neste horário.');
    }
    if (await reservas.existeSobreposicaoAgenda(usuario.id, inicio, fim, ignorarId)) {
      await recusarPorConflito(usuario, recursoId, inicio, fim, 'Você já possui outra reserva neste horário (conflito de agenda).');
    }
  }

  return {
    async listar(usuario, { minhas, estado }) {
      const apenasMinhas = minhas || usuario.perfil === 'SOLICITANTE';
      const [lista, todosRecursos] = await Promise.all([
        reservas.listar(apenasMinhas ? { solicitanteId: usuario.id } : {}),
        recursos.listar(),
      ]);
      const restrito = new Map(todosRecursos.map((r) => [r._id, r.restrito]));
      return lista.filter((r) => !estado || r.estado === estado).map((r) => reservaDto(r, restrito.get(r.recursoId)));
    },

    async obter(id, usuario) {
      const r = await exigirReserva(id);
      if (usuario.perfil === 'SOLICITANTE' && r.solicitanteId !== usuario.id) {
        throw new ApiError(403, 'Você só pode consultar as suas próprias reservas.');
      }
      return reservaDto(r, await restritoDe(r));
    },

    async criar(usuario, { recursoId, inicio, fim, finalidade }) {
      validarPeriodo(inicio, fim);
      const recurso = await exigirRecurso(recursoId);

      return bloquear([`recurso:${recursoId}`, `agenda:${usuario.id}`], async () => {
        await garantirLivre(usuario, recursoId, inicio, fim);
        const reserva = await reservas.inserir({
          recursoId,
          recursoNome: recurso.nome,
          solicitanteId: usuario.id,
          solicitanteNome: usuario.nome,
          inicio,
          fim,
          estado: 'SOLICITADA',
          finalidade,
          criadoEm: relogio.agora(),
        });
        try {
          await registrarAuditoria(reserva, usuario, null, 'SOLICITADA', 'Solicitação criada');
        } catch (e) {
          await reservas.remover(reserva._id); // compensação: sem auditoria não há reserva
          throw e;
        }
        return reservaDto(reserva, recurso.restrito);
      });
    },

    async atualizar(id, usuario, { recursoId, inicio, fim, finalidade }) {
      validarPeriodo(inicio, fim);
      const atual = await exigirReserva(id);
      if (atual.solicitanteId !== usuario.id) throw new ApiError(403, 'Você só pode alterar as suas próprias reservas.');
      const recurso = await exigirRecurso(recursoId);

      return bloquear([`recurso:${recursoId}`, `agenda:${usuario.id}`], async () => {
        const corrente = await exigirReserva(id);
        if (corrente.estado !== 'SOLICITADA') {
          throw new ApiError(409, 'Só é possível alterar reservas que ainda estão SOLICITADAS.');
        }
        await garantirLivre(usuario, recursoId, inicio, fim, id);
        const alteracoes = { recursoId, recursoNome: recurso.nome, inicio, fim, finalidade };
        const aplicou = await reservas.atualizar(id, alteracoes, { estado: 'SOLICITADA' });
        if (!aplicou) throw new ApiError(409, 'A reserva mudou de estado durante a alteração.');
        const nova = { ...corrente, ...alteracoes };
        try {
          await registrarAuditoria(nova, usuario, 'SOLICITADA', 'SOLICITADA', 'Reserva alterada');
        } catch (e) {
          await reservas.atualizar(id, { recursoId: corrente.recursoId, recursoNome: corrente.recursoNome, inicio: corrente.inicio, fim: corrente.fim, finalidade: corrente.finalidade });
          throw e;
        }
        return reservaDto(nova, recurso.restrito);
      });
    },

    async transicionar(id, acao, usuario, motivoBruto) {
      const reserva = await exigirReserva(id);
      const restrito = await restritoDe(reserva);
      const def = verificarTransicao({
        acao,
        estado: reserva.estado,
        perfil: usuario.perfil,
        ehDono: reserva.solicitanteId === usuario.id,
        recursoRestrito: restrito,
      });

      const motivo = typeof motivoBruto === 'string' ? motivoBruto.trim().slice(0, 300) : '';
      if (def.exigeMotivo && !motivo) throw new ApiError(400, "O campo 'motivo' é obrigatório para esta ação.");

      // compare-and-set: se outra requisição mudou o estado antes, esta não aplica (409)
      const aplicou = await reservas.atualizar(id, { estado: def.destino }, { estado: reserva.estado });
      if (!aplicou) throw new ApiError(409, 'A reserva foi alterada por outra operação. Atualize a página.');
      try {
        await registrarAuditoria(reserva, usuario, reserva.estado, def.destino, motivo || 'Sem motivo informado');
      } catch (e) {
        await reservas.atualizar(id, { estado: reserva.estado }, { estado: def.destino }); // desfaz
        throw e;
      }
      return reservaDto({ ...reserva, estado: def.destino }, restrito);
    },

    async historico(id) {
      await exigirReserva(id);
      return (await auditoria.listarPorReserva(id)).map(auditoriaDto);
    },
  };
}
