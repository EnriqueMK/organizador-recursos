import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <section class="card login">
      <h1>📦 Organizador de Recursos</h1>
      <form [formGroup]="form" (ngSubmit)="entrar()">
        <label>E-mail <input type="email" formControlName="email" autocomplete="username" /></label>
        <label>Senha <input type="password" formControlName="senha" autocomplete="current-password" /></label>
        @if (falhou()) { <p class="erro" role="alert">E-mail ou senha inválidos.</p> }
        <button type="submit" [disabled]="form.invalid || carregando()">Entrar</button>
      </form>
    </section>

    @if (demo) {
      <section class="card demo">
        <strong>Modo demonstração</strong>
        <p>Dados fictícios em memória. Clique para preencher (senha <code>123456</code>):</p>
        <div class="acoes">
          @for (c of contas; track c.email) {
            <button type="button" class="secundario" (click)="preencher(c.email)">{{ c.rotulo }}</button>
          }
        </div>
      </section>
    }`,
  styles: [`
    .login{max-width:380px;margin:8vh auto 1rem;padding:2rem}
    h1{font-size:1.4rem;margin-top:0}
    .demo{max-width:380px;margin:0 auto;background:#eff6ff;border-color:#bfdbfe}
    .demo p{margin:.4rem 0;font-size:.85rem}
    code{background:#dbeafe;padding:.1rem .3rem;border-radius:4px}
  `],
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);

  demo = environment.useMock;
  contas = [
    { rotulo: 'Administrador', email: 'admin@exemplo.test' },
    { rotulo: 'Responsável', email: 'responsavel@exemplo.test' },
    { rotulo: 'Solicitante', email: 'solicitante@exemplo.test' },
    { rotulo: 'Solicitante 2', email: 'solicitante2@exemplo.test' },
  ];

  carregando = signal(false);
  falhou = signal(false);
  form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    senha: ['', [Validators.required, Validators.minLength(6)]],
  });

  preencher(email: string) { this.form.setValue({ email, senha: '123456' }); }

  entrar() {
    this.carregando.set(true);
    this.falhou.set(false);
    const { email, senha } = this.form.getRawValue();
    this.auth.login(email, senha).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: () => { this.falhou.set(true); this.carregando.set(false); },
    });
  }
}
