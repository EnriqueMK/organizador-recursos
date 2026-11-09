import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <nav class="nav">
      <a class="brand" routerLink="/dashboard">📦 Organizador de Recursos</a>
      <div class="links">
        <a routerLink="/recursos" routerLinkActive="on">Recursos</a>
        <a routerLink="/reservas" routerLinkActive="on">Reservas</a>
        <a routerLink="/agenda" routerLinkActive="on">Minha agenda</a>
        @if (auth.temPerfil('RESPONSAVEL', 'ADMINISTRADOR')) {
          <a routerLink="/relatorios/utilizacao" routerLinkActive="on">Relatórios</a>
        }
      </div>
      <div class="user">
        <span>{{ auth.usuario()?.nome }} · {{ auth.usuario()?.perfil }}</span>
        <button (click)="auth.logout()">Sair</button>
      </div>
    </nav>`,
  styles: [`
    .nav{display:flex;align-items:center;gap:1.5rem;padding:.75rem 1.5rem;background:#111827;color:#fff;flex-wrap:wrap}
    .brand{font-weight:700;color:#fff;text-decoration:none}.links{display:flex;gap:1rem;flex:1}
    .links a{color:#9ca3af;text-decoration:none}.links a.on{color:#fff}
    .user{display:flex;gap:.75rem;align-items:center;font-size:.85rem}
    button{background:#374151}
  `],
})
export class NavbarComponent { auth = inject(AuthService); }
