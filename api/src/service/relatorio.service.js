import { COM_USO } from '../domain/constantes.js';
import { horasNoPeriodo, validarPeriodo } from '../domain/periodo.js';

const arredondar = (h) => Math.round(h * 100) / 100;

export function criarRelatorioService({ reservas, tentativas }) {
  return {
    /** Horas por recurso e por professor (só estados com uso, recortadas ao período) + conflitos evitados. */
    async utilizacao(inicio, fim) {
      validarPeriodo(inicio, fim);
      const [lista, conflitos] = await Promise.all([
        reservas.comUsoNoPeriodo(COM_USO, inicio, fim),
        tentativas.contar(inicio, fim),
      ]);

      const porRecurso = new Map();
      const porProfessor = new Map();
      for (const r of lista) {
        const h = horasNoPeriodo(r.inicio, r.fim, inicio, fim);
        if (h <= 0) continue;
        const rec = porRecurso.get(r.recursoId) ?? { recursoId: r.recursoId, recursoNome: r.recursoNome, horas: 0 };
        rec.horas += h;
        porRecurso.set(r.recursoId, rec);
        const prof = porProfessor.get(r.solicitanteId) ?? { professorId: r.solicitanteId, professorNome: r.solicitanteNome, horas: 0 };
        prof.horas += h;
        porProfessor.set(r.solicitanteId, prof);
      }

      const final = (mapa, chave) =>
        [...mapa.values()].map((x) => ({ ...x, horas: arredondar(x.horas) })).sort((a, b) => a[chave].localeCompare(b[chave]));

      return {
        inicio: inicio.toISOString(),
        fim: fim.toISOString(),
        horasPorRecurso: final(porRecurso, 'recursoNome'),
        cargaPorProfessor: final(porProfessor, 'professorNome'),
        conflitosEvitados: conflitos,
      };
    },
  };
}
