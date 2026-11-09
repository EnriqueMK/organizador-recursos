import { LoginResponse, Perfil } from '../core/models/usuario.model';

/** Sessões fictícias por perfil para usar em testes (nenhum dado pessoal real). */
export function sessaoFake(perfil: Perfil, id = 1): LoginResponse {
  return {
    token: `token-fake-${perfil.toLowerCase()}`,
    usuario: { id, nome: `Usuário ${perfil}`, email: `${perfil.toLowerCase()}@exemplo.test`, perfil },
  };
}
