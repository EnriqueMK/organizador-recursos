import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { ReservasService } from '../../core/services/reservas.service';
import { Reserva } from '../../core/models/reserva.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink],
  template: `
    <h2>Olá, {{ auth.usuario()?.nome }}</h2>
    <section class="grid">
      <div class="card kpi"><strong>{{ contar('SOLICITADA') }}</strong><span>aguardando aprovação</span></div>
      <div class="card kpi"><strong>{{ contar('APROVADA') }}</strong><span>aprovadas</span></div>
      <div class="card kpi"><strong>{{ contar('EM_USO') }}</strong><span>em uso</span></div>
      <div class="card kpi"><strong>{{ total() }}</strong><span>total de reservas</span></div>
    </section>
    <div class="acoes">
      <a class="btn" routerLink="/reservas/nova">Nova reserva</a>
      <a class="btn secundario" routerLink="/recursos">Ver recursos</a>
    </div>`,
})
export class DashboardComponent implements OnInit {
  auth = inject(AuthService);
  private api = inject(ReservasService);
  private reservas = signal<Reserva[]>([]);
  total = computed(() => this.reservas().length);

  ngOnInit() { this.api.listar().subscribe(r => this.reservas.set(r)); }
  contar(estado: string) { return this.reservas().filter(r => r.estado === estado).length; }
}
