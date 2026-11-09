import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';
import { roleGuard } from './core/auth/role.guard';

export const routes: Routes = [
  { path: 'login', loadComponent: () => import('./features/login/login.component').then(m => m.LoginComponent) },
  {
    path: '',
    canActivate: [authGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      { path: 'dashboard', loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent) },

      { path: 'recursos', loadComponent: () => import('./features/recursos/recursos-list.component').then(m => m.RecursosListComponent) },
      { path: 'recursos/novo', canActivate: [roleGuard(['ADMINISTRADOR'])],
        loadComponent: () => import('./features/recursos/recurso-form.component').then(m => m.RecursoFormComponent) },
      { path: 'recursos/:id/disponibilidade',
        loadComponent: () => import('./features/recursos/disponibilidade.component').then(m => m.DisponibilidadeComponent) },
      { path: 'recursos/:id/manutencao', canActivate: [roleGuard(['RESPONSAVEL', 'ADMINISTRADOR'])],
        loadComponent: () => import('./features/recursos/manutencao.component').then(m => m.ManutencaoComponent) },

      { path: 'reservas', loadComponent: () => import('./features/reservas/reservas-list.component').then(m => m.ReservasListComponent) },
      { path: 'reservas/nova', loadComponent: () => import('./features/reservas/reserva-form.component').then(m => m.ReservaFormComponent) },
      { path: 'reservas/:id', loadComponent: () => import('./features/reservas/reserva-detalhe.component').then(m => m.ReservaDetalheComponent) },
      { path: 'reservas/:id/historico', canActivate: [roleGuard(['RESPONSAVEL', 'ADMINISTRADOR'])],
        loadComponent: () => import('./features/auditoria/historico-reserva.component').then(m => m.HistoricoReservaComponent) },

      { path: 'agenda', loadComponent: () => import('./features/agenda/agenda-professor.component').then(m => m.AgendaProfessorComponent) },
      { path: 'relatorios/utilizacao', canActivate: [roleGuard(['RESPONSAVEL', 'ADMINISTRADOR'])],
        loadComponent: () => import('./features/relatorios/relatorio-utilizacao.component').then(m => m.RelatorioUtilizacaoComponent) },
    ],
  },
  { path: 'acesso-negado', loadComponent: () => import('./features/erros/acesso-negado.component').then(m => m.AcessoNegadoComponent) },
  { path: '**', loadComponent: () => import('./features/erros/nao-encontrado.component').then(m => m.NaoEncontradoComponent) },
];
