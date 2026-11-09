import { ApiError } from '../util/api-error.js';

export const naoEncontrado = (req, _res, next) =>
  next(new ApiError(404, `Rota não encontrada: ${req.method} ${req.path}`));

/** Toda resposta de erro tem o formato { title, status, detail } — nunca stack trace, SQL ou nome de classe. */
// eslint-disable-next-line no-unused-vars
export function tratarErros(err, _req, res, _next) {
  if (err instanceof ApiError) {
    return res.status(err.status).json({ title: err.title, status: err.status, detail: err.detail });
  }
  if (err?.type === 'entity.parse.failed' || err instanceof SyntaxError) {
    return res.status(400).json({ title: 'Requisição inválida', status: 400, detail: 'JSON inválido no corpo da requisição.' });
  }
  if (err?.type === 'entity.too.large') {
    return res.status(400).json({ title: 'Requisição inválida', status: 400, detail: 'Corpo da requisição muito grande.' });
  }
  console.error('[erro inesperado]', err);
  return res.status(500).json({ title: 'Erro interno', status: 500, detail: 'Erro inesperado no servidor.' });
}
