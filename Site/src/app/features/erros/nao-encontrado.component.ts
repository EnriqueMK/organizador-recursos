import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-nao-encontrado',
  standalone: true,
  imports: [RouterLink],
  template: `<div class="card vazio"><h2>404 · Página não encontrada</h2><a class="btn" routerLink="/dashboard">Voltar ao início</a></div>`,
})
export class NaoEncontradoComponent {}
