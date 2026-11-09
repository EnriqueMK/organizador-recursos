import { ApiError } from '../util/api-error.js';

const t = (d) => d.getTime();

/** Intervalos semiabertos [início, fim): terminar exatamente quando outro começa NÃO é sobreposição. */
export function sobrepoe(aInicio, aFim, bInicio, bFim) {
  return t(aInicio) < t(bFim) && t(bInicio) < t(aFim);
}

export function validarPeriodo(inicio, fim) {
  if (t(fim) <= t(inicio)) throw new ApiError(400, 'O término deve ser depois do início.');
}

/** Janelas livres dentro de [inicio, fim] descontados os intervalos ocupados. */
export function janelasLivres(inicio, fim, ocupados) {
  const ordenados = ocupados
    .filter((o) => t(o.inicio) < t(fim) && t(o.fim) > t(inicio))
    .sort((x, y) => t(x.inicio) - t(y.inicio));
  const livres = [];
  let cursor = t(inicio);
  for (const o of ordenados) {
    if (t(o.inicio) > cursor) livres.push({ inicio: new Date(cursor), fim: o.inicio });
    cursor = Math.max(cursor, t(o.fim));
  }
  if (cursor < t(fim)) livres.push({ inicio: new Date(cursor), fim });
  return livres;
}

/** Horas do intervalo [aInicio, aFim) que caem dentro do período [pInicio, pFim). */
export function horasNoPeriodo(aInicio, aFim, pInicio, pFim) {
  const i = Math.max(t(aInicio), t(pInicio));
  const f = Math.min(t(aFim), t(pFim));
  return f > i ? (f - i) / 3_600_000 : 0;
}
