import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { RecursosService } from '../../core/services/recursos.service';
import { Recurso } from '../../core/models/recurso.model';

@Component({
  selector: 'app-recursos-list',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="acoes" style="justify-content:space-between">
      <h2>Recursos</h2>
      @if (auth.temPerfil('ADMINISTRADOR')) { <a class="btn" routerLink="/recursos/novo">Novo recurso</a> }
    </div>
    <table class="tabela">
      <thead><tr><th>Nome</th><th>Tipo</th><th>Capacidade</th><th>Situação</th><th></th></tr></thead>
      <tbody>
        @for (r of recursos(); track r.id) {
          <tr>
            <td>{{ r.nome }}</td>
            <td>{{ r.tipo }}</td>
            <td>{{ r.capacidade }}</td>
            <td>
              @if (r.emManutencao) { 🛠 Em manutenção }
              @else if (r.restrito) { 🔒 Restrito (requer aprovação) }
              @else { ✅ Livre }
            </td>
            <td class="acoes">
              <a [routerLink]="['/recursos', r.id, 'disponibilidade']">Disponibilidade</a>
              @if (auth.temPerfil('RESPONSAVEL', 'ADMINISTRADOR')) {
                <a [routerLink]="['/recursos', r.id, 'manutencao']">Manutenção</a>
              }
            </td>
          </tr>
        } @empty { <tr><td colspan="5" class="vazio">Nenhum recurso cadastrado.</td></tr> }
      </tbody>
    </table>`,
})
export class RecursosListComponent implements OnInit {
  auth = inject(AuthService);
  private api = inject(RecursosService);
  recursos = signal<Recurso[]>([]);
  ngOnInit() { this.api.listar().subscribe(r => this.recursos.set(r)); }
}
