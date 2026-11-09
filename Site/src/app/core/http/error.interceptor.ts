import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { NotificacaoService } from '../services/notificacao.service';
import { mensagemAmigavel, ProblemDetail } from './problem-detail';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const toast = inject(NotificacaoService);

  return next(req).pipe(
    catchError((e: HttpErrorResponse) => {
      const pd = e.error as ProblemDetail | undefined;
      const ehLogin = req.url.endsWith('/auth/login');
      if (e.status === 401 && !ehLogin) auth.logout();
      else if (e.status === 403) router.navigate(['/acesso-negado']);
      else if (!ehLogin) toast.erro(mensagemAmigavel(e.status, pd));
      return throwError(() => e);
    }),
  );
};
