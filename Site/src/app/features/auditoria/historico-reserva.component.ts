import { Component, Input, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { AuditoriaService } from '../../core/services/auditoria.service';
import { RegistroAuditoria } from '../../core/models/auditoria.model';

@Component({
  selector: 'app-historico-reserva',
  standalone: true,
  imports: [DatePipe],
  template: `
    <h2>Histórico da reserva #{{ id }}</h2>
    <p class="vazio" style="padding:0;text-align:left">Registros somente leitura: não podem ser alterados nem apagados.</p>
    <table class="tabela">
      <thead><tr><th>Quando</th><th>Quem</th><th>De</th><th>Para</th><th>Motivo</th></tr></thead>
      <tbody>
        @for (r of registros(); track r.id) {
          <tr>
            <td>{{ r.instante | date:'dd/MM/yyyy HH:mm:ss' }}</td>
            <td>{{ r.usuarioNome }}</td>
            <td>{{ r.estadoAnterior ?? '—' }}</td>
            <td>{{ r.estadoNovo }}</td>
            <td>{{ r.motivo }}</td>
          </tr>
        } @empty { <tr><td colspan="5" class="vazio">Sem registros.</td></tr> }
      </tbody>
    </table>`,
})
export class HistoricoReservaComponent implements OnInit {
  @Input() id!: string;
  private api = inject(AuditoriaService);
  registros = signal<RegistroAuditoria[]>([]);
  ngOnInit() { this.api.historico(+this.id).subscribe(r => this.registros.set(r)); }
}
