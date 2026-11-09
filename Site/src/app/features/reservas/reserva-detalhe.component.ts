import { Component, Input, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { ReservasService } from '../../core/services/reservas.service';
import { NotificacaoService } from '../../core/services/notificacao.service';
import { AcaoReserva, Reserva } from '../../core/models/reserva.model';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { acoesPermitidas } from '../../shared/utils/transicoes-reserva';

const PEDE_MOTIVO: AcaoReserva[] = ['rejeitar', 'cancelar', 'nao-compareceu'];

@Component({
  selector: 'app-reserva-detalhe',
  standalone: true,
  imports: [DatePipe, RouterLink, StatusBadgeComponent, ConfirmDialogComponent],
  template: `
    @if (reserva(); as r) {
      <article class="card">
        <h2>{{ r.recursoNome }} <app-status-badge [estado]="r.estado" /></h2>
        <p>{{ r.inicio | date:'dd/MM/yyyy HH:mm' }} → {{ r.fim | date:'dd/MM/yyyy HH:mm' }}</p>
        <p>Solicitante: {{ r.solicitanteNome }}</p>
        <p>{{ r.finalidade }}</p>
        <div class="acoes">
          @for (a of acoes(); track a.acao) {
            <button (click)="clicar(a.acao)">{{ a.rotulo }}</button>
          }
          @if (auth.temPerfil('RESPONSAVEL', 'ADMINISTRADOR')) {
            <a [routerLink]="['/reservas', r.id, 'historico']">Ver histórico</a>
          }
        </div>
      </article>
    }
    @if (pendente(); as acao) {
      <app-confirm-dialog
        [titulo]="'Confirmar: ' + acao"
        [pedeMotivo]="pedeMotivo(acao)"
        (confirmar)="executar(acao, $event)"
        (cancelar)="pendente.set(null)" />
    }`,
})
export class ReservaDetalheComponent implements OnInit {
  @Input() id!: string;   // vem da rota (withComponentInputBinding)
  auth = inject(AuthService);
  private api = inject(ReservasService);
  private toast = inject(NotificacaoService);

  reserva = signal<Reserva | null>(null);
  pendente = signal<AcaoReserva | null>(null);

  acoes = computed(() => {
    const r = this.reserva(); const u = this.auth.usuario();
    return r && u ? acoesPermitidas(r.estado, u.perfil, r.solicitanteId === u.id, !!r.recursoRestrito) : [];
  });

  ngOnInit() { this.api.obter(+this.id).subscribe(r => this.reserva.set(r)); }

  pedeMotivo(a: AcaoReserva) { return PEDE_MOTIVO.includes(a); }
  clicar(a: AcaoReserva) { this.pendente.set(a); }

  executar(acao: AcaoReserva, motivo: string) {
    this.pendente.set(null);
    this.api.transicionar(+this.id, acao, motivo || undefined).subscribe(r => {
      this.reserva.set(r);
      this.toast.ok('Estado atualizado.');
    });
  }
}
