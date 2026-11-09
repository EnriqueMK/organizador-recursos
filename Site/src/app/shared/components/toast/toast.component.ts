import { Component, inject } from '@angular/core';
import { NotificacaoService } from '../../../core/services/notificacao.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  template: `
    <div class="stack" aria-live="polite">
      @for (t of svc.toasts(); track t.id) {
        <div class="toast" [class.erro]="t.tipo === 'erro'">{{ t.texto }}</div>
      }
    </div>`,
  styles: [`
    .stack{position:fixed;right:1rem;bottom:1rem;display:grid;gap:.5rem;z-index:50}
    .toast{background:#065f46;color:#fff;padding:.7rem 1rem;border-radius:8px;box-shadow:0 4px 12px #0003}
    .toast.erro{background:#991b1b;color:#fff}
  `],
})
export class ToastComponent { svc = inject(NotificacaoService); }
