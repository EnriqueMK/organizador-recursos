import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-acesso-negado',
  standalone: true,
  imports: [RouterLink],
  template: `<div class="card vazio"><h2>403 · Acesso negado</h2><p>Você não tem permissão para acessar esta área.</p><a class="btn" routerLink="/dashboard">Voltar ao início</a></div>`,
})
export class AcessoNegadoComponent {}
