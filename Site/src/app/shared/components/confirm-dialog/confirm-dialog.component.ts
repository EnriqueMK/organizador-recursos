import { Component, EventEmitter, Input, Output } from '@angular/core';

/** Diálogo simples de confirmação, com campo opcional de motivo (usado em rejeitar/cancelar). */
@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  template: `
    <div class="overlay" (click)="cancelar.emit()">
      <div class="dialog card" role="dialog" aria-modal="true" (click)="$event.stopPropagation()">
        <h3>{{ titulo }}</h3>
        @if (pedeMotivo) {
          <label>Motivo <textarea #m rows="3" (input)="motivo = m.value"></textarea></label>
        }
        <div class="acoes">
          <button class="secundario" (click)="cancelar.emit()">Voltar</button>
          <button [disabled]="pedeMotivo && !motivo.trim()" (click)="confirmar.emit(motivo.trim())">Confirmar</button>
        </div>
      </div>
    </div>`,
  styles: [`
    .overlay{position:fixed;inset:0;background:#0006;display:grid;place-items:center;z-index:40}
    .dialog{min-width:320px;max-width:90vw}
  `],
})
export class ConfirmDialogComponent {
  @Input() titulo = 'Confirmar ação?';
  @Input() pedeMotivo = false;
  @Output() confirmar = new EventEmitter<string>();
  @Output() cancelar = new EventEmitter<void>();
  motivo = '';
}
