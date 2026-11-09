import { ApiError } from '../util/api-error.js';
import { janelasLivres, validarPeriodo } from '../domain/periodo.js';
import { manutencaoDto, recursoDto } from '../entity/mapeadores.js';

export function criarRecursoService({ recursos, manutencoes, reservas, relogio }) {
  async function exigirRecurso(id) {
    const r = await recursos.buscar(id);
    if (!r) throw new ApiError(404, 'Recurso inexistente.');
    return r;
  }

  return {
    async listar() {
      const [todos, emManutencao] = await Promise.all([recursos.listar(), manutencoes.emAndamento(relogio.agora())]);
      return todos.map((r) => recursoDto(r, emManutencao.includes(r._id)));
    },

    async criar({ nome, tipo, capacidade, restrito }) {
      const novo = await recursos.inserir({ nome, tipo, capacidade, restrito });
      return recursoDto(novo, false);
    },

    async disponibilidade(id, inicio, fim) {
      validarPeriodo(inicio, fim);
      await exigirRecurso(id);
      const [rs, ms] = await Promise.all([reservas.ativasNoPeriodo(id, inicio, fim), manutencoes.noPeriodo(id, inicio, fim)]);
      const livres = janelasLivres(inicio, fim, [...rs, ...ms]);
      return {
        recursoId: id,
        livres: livres.map((j) => ({ inicio: j.inicio.toISOString(), fim: j.fim.toISOString() })),
      };
    },

    async listarManutencoes(id) {
      await exigirRecurso(id);
      return (await manutencoes.listarPorRecurso(id)).map(manutencaoDto);
    },

    async registrarManutencao(id, { inicio, fim, motivo }) {
      validarPeriodo(inicio, fim);
      await exigirRecurso(id);
      if (await manutencoes.existeSobreposicao(id, inicio, fim)) {
        throw new ApiError(409, 'Já existe manutenção registrada para este período.');
      }
      return manutencaoDto(await manutencoes.inserir({ recursoId: id, inicio, fim, motivo }));
    },
  };
}
