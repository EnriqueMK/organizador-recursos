import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LoginResponse, Perfil, Usuario } from '../models/usuario.model';

const CHAVE = 'org-recursos.sessao';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  private sessao = signal<LoginResponse | null>(this.restaurar());

  readonly usuario = computed<Usuario | null>(() => this.sessao()?.usuario ?? null);
  readonly token = computed(() => this.sessao()?.token ?? null);
  readonly autenticado = computed(() => !!this.sessao());

  login(email: string, senha: string) {
    return this.http
      .post<LoginResponse>(`${environment.apiUrl}/auth/login`, { email, senha })
      .pipe(tap(r => this.salvar(r)));
  }

  logout() {
    sessionStorage.removeItem(CHAVE);
    this.sessao.set(null);
    this.router.navigate(['/login']);
  }

  temPerfil(...perfis: Perfil[]): boolean {
    const p = this.usuario()?.perfil;
    return !!p && perfis.includes(p);
  }

  private salvar(r: LoginResponse) {
    sessionStorage.setItem(CHAVE, JSON.stringify(r));
    this.sessao.set(r);
  }

  private restaurar(): LoginResponse | null {
    try {
      const raw = sessionStorage.getItem(CHAVE);
      return raw ? (JSON.parse(raw) as LoginResponse) : null;
    } catch {
      return null;
    }
  }
}
