import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { Perfil } from '../models/usuario.model';

/** A guarda melhora a UX; a autorização real é feita pelo backend (401/403). */
export const roleGuard = (perfis: Perfil[]): CanActivateFn => () => {
  const auth = inject(AuthService);
  return auth.temPerfil(...perfis) ? true : inject(Router).createUrlTree(['/acesso-negado']);
};
