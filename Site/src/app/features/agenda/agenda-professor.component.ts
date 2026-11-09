import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ReservasService } from '../../core/services/reservas.service';
import { Reserva } from '../../core/models/reserva.model';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { DuracaoPipe } from '../../shared/pipes/duracao.pipe';

@Component({
  selector: 'app-agenda-professor',
  standalone: true,
  imports: [DatePipe, RouterLink, StatusBadgeComponent, DuracaoPipe],
  template: `
    <h2>Minha agenda</h2>
    <table class="tabela">
      <thead><tr><th>Data</th><th>Horário</th><th>Duração</th><th>Recurso</th><th>Estado</th></tr></thead>
      <tbody>
        @for (r of ordenadas(); track r.id) {
          <tr>
            <td>{{ r.inicio | date:'dd/MM/yyyy' }}</td>
            <td>{{ r.inicio | date:'HH:mm' }} – {{ r.fim | date:'HH:mm' }}</td>
            <td>{{ r.inicio | duracao:r.fim }}</td>
            <td><a [routerLink]="['/reservas', r.id]">{{ r.recursoNome }}</a></td>
            <td><app-status-badge [estado]="r.estado" /></td>
          </tr>
        } @empty { <tr><td colspan="5" class="vazio">Você ainda não tem reservas.</td></tr> }
      </tbody>
    </table>`,
})
export class AgendaProfessorComponent implements OnInit {
  private api = inject(ReservasService);
  private reservas = signal<Reserva[]>([]);
  ordenadas = computed(() =>
    [...this.reservas()].sort((a, b) => a.inicio.localeCompare(b.inicio)));

  ngOnInit() { this.api.listar({ minhas: true }).subscribe(r => this.reservas.set(r)); }
}
