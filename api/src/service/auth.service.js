import bcrypt from 'bcryptjs';
import { ApiError } from '../util/api-error.js';
import { usuarioDto } from '../entity/mapeadores.js';

export function criarAuthService({ usuarios, jwt }) {
  return {
    async login({ email, senha }) {
      const u = typeof email === 'string' ? await usuarios.buscarPorEmail(email.trim().toLowerCase()) : null;
      const ok = u && typeof senha === 'string' && (await bcrypt.compare(senha, u.senhaHash));
      if (!ok) throw new ApiError(401, 'E-mail ou senha inválidos.');
      return { token: jwt.emitir(u), usuario: usuarioDto(u) };
    },
  };
}
