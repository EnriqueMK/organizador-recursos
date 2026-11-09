import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ReservasService } from '../../core/services/reservas.service';
import { Reserva } from '../../core/models/reserva.model';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';

@Component({
  selector: 'app-reservas-list',
  standalone: true,
  imports: [DatePipe, RouterLink, StatusBadgeComponent],
  template: `
    <div class="acoes" style="justify-content:space-between">
      <h2>Reservas</h2>
      <a class="btn" routerLink="/reservas/nova">Nova reserva</a>
    </div>
    <div class="filtros card">
      <label>Estado
        <select #f (change)="carregar(f.value)">
          <option value="">Todos</option>
          @for (e of estados; track e) { <option [value]="e">{{ e }}</option> }
        </select>
      </label>
    </div>
    <table class="tabela">
      <thead><tr><th>Recurso</th><th>Solicitante</th><th>Período</th><th>Estado</th><th></th></tr></thead>
      <tbody>
        @for (r of reservas(); track r.id) {
          <tr>
            <td>{{ r.recursoNome }}</td>
            <td>{{ r.solicitanteNome }}</td>
            <td>{{ r.inicio | date:'dd/MM HH:mm' }} → {{ r.fim | date:'dd/MM HH:mm' }}</td>
            <td><app-status-badge [estado]="r.estado" /></td>
            <td><a [routerLink]="['/reservas', r.id]">Abrir</a></td>
          </tr>
        } @empty { <tr><td colspan="5" class="vazio">Nenhuma reserva encontrada.</td></tr> }
      </tbody>
    </table>`,
})
export class ReservasListComponent implements OnInit {
  private api = inject(ReservasService);
  reservas = signal<Reserva[]>([]);
  estados = ['SOLICITADA', 'APROVADA', 'EM_USO', 'CONCLUIDA', 'REJEITADA', 'CANCELADA', 'NAO_COMPARECEU'];

  ngOnInit() { this.carregar(''); }
  carregar(estado: string) { this.api.listar({ estado }).subscribe(r => this.reservas.set(r)); }
}
