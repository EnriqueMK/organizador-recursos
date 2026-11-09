import jwt from 'jsonwebtoken';
import { ApiError } from '../util/api-error.js';

export function criarJwt({ jwtSecret, jwtExpiracao }) {
  return {
    emitir: (usuario) =>
      jwt.sign({ nome: usuario.nome, email: usuario.email, perfil: usuario.perfil }, jwtSecret, {
        subject: String(usuario._id),
        expiresIn: jwtExpiracao,
      }),
    verificar: (token) => {
      const p = jwt.verify(token, jwtSecret);
      return { id: Number(p.sub), nome: p.nome, email: p.email, perfil: p.perfil };
    },
  };
}

/** 401 se não houver token válido. Preenche req.usuario = { id, nome, email, perfil }. */
export const autenticar = (jwtServico) => (req, _res, next) => {
  const m = /^Bearer (.+)$/.exec(req.headers.authorization ?? '');
  if (!m) return next(new ApiError(401, 'Autenticação necessária.'));
  try {
    req.usuario = jwtServico.verificar(m[1]);
    return next();
  } catch {
    return next(new ApiError(401, 'Sessão inválida ou expirada.'));
  }
};

/** 403 se o perfil do usuário não estiver na lista. */
export const exigirPerfil = (...perfis) => (req, _res, next) =>
  perfis.includes(req.usuario.perfil)
    ? next()
    : next(new ApiError(403, 'Você não tem permissão para esta operação.'));
