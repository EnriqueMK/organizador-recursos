import { ApiError } from './api-error.js';

const invalido = (mensagem) => new ApiError(400, mensagem);

export function objeto(valor) {
  if (valor === null || typeof valor !== 'object' || Array.isArray(valor)) {
    throw invalido('Corpo da requisição inválido.');
  }
  return valor;
}

export function texto(o, campo, { max = 200, obrigatorio = true } = {}) {
  const v = o[campo];
  if (v === undefined || v === null || (typeof v === 'string' && !v.trim())) {
    if (!obrigatorio) return undefined;
    throw invalido(`O campo '${campo}' é obrigatório.`);
  }
  if (typeof v !== 'string') throw invalido(`O campo '${campo}' deve ser um texto.`);
  const t = v.trim();
  if (t.length > max) throw invalido(`O campo '${campo}' deve ter no máximo ${max} caracteres.`);
  return t;
}

export function inteiro(o, campo, { min = 1 } = {}) {
  const v = o[campo];
  if (v === undefined || v === null) throw invalido(`O campo '${campo}' é obrigatório.`);
  if (!Number.isInteger(v) || v < min) {
    throw invalido(`O campo '${campo}' deve ser um número inteiro maior ou igual a ${min}.`);
  }
  return v;
}

export function booleano(o, campo, padrao = false) {
  const v = o[campo];
  if (v === undefined || v === null) return padrao;
  if (typeof v !== 'boolean') throw invalido(`O campo '${campo}' deve ser verdadeiro ou falso.`);
  return v;
}

export function opcao(o, campo, validos) {
  const v = o[campo];
  if (v === undefined || v === null || v === '') throw invalido(`O campo '${campo}' é obrigatório.`);
  if (!validos.includes(v)) throw invalido(`O campo '${campo}' deve ser um de: ${validos.join(', ')}.`);
  return v;
}

export function data(o, campo) {
  const v = o[campo];
  if (v === undefined || v === null || v === '') throw invalido(`O campo '${campo}' é obrigatório.`);
  return paraData(v, campo);
}

export function paraData(valor, campo) {
  const d = typeof valor === 'string' ? new Date(valor) : null;
  if (!d || Number.isNaN(d.getTime())) throw invalido(`O campo '${campo}' deve ser uma data/hora válida (ISO-8601).`);
  return d;
}

export function dataQuery(query, campo) {
  const v = query[campo];
  if (typeof v !== 'string' || !v) throw invalido(`O parâmetro '${campo}' é obrigatório.`);
  return paraData(v, campo);
}

export function idParam(valor) {
  const n = Number(valor);
  if (!Number.isInteger(n) || n < 1) throw invalido('Identificador inválido.');
  return n;
}
