import { Component, Input } from '@angular/core';
import { EstadoReserva } from '../../../core/models/reserva.model';

const ROTULOS: Record<EstadoReserva, string> = {
  SOLICITADA: 'Solicitada', APROVADA: 'Aprovada', EM_USO: 'Em uso', CONCLUIDA: 'Concluída',
  REJEITADA: 'Rejeitada', CANCELADA: 'Cancelada', NAO_COMPARECEU: 'Não compareceu',
};

@Component({
  selector: 'app-status-badge',
  standalone: true,
  template: `<span class="badge" [class]="estado.toLowerCase()">{{ rotulo }}</span>`,
  styles: [`
    .badge{padding:.2rem .6rem;border-radius:999px;font-size:.75rem;font-weight:600;background:#e5e7eb;color:#374151}
    .solicitada{background:#fef3c7;color:#92400e}.aprovada{background:#d1fae5;color:#065f46}
    .em_uso{background:#dbeafe;color:#1e40af}.concluida{background:#e0e7ff;color:#3730a3}
    .rejeitada,.cancelada,.nao_compareceu{background:#fee2e2;color:#991b1b}
  `],
})
export class StatusBadgeComponent {
  @Input({ required: true }) estado!: EstadoReserva;
  get rotulo() { return ROTULOS[this.estado]; }
}
