export type Perfil = 'SOLICITANTE' | 'RESPONSAVEL' | 'ADMINISTRADOR';

export interface Usuario {
  id: number;
  nome: string;
  email: string;
  perfil: Perfil;
}

export interface LoginResponse {
  token: string;
  usuario: Usuario;
}
