import { Injectable, signal } from '@angular/core';

export interface Toast { id: number; tipo: 'ok' | 'erro'; texto: string }

@Injectable({ providedIn: 'root' })
export class NotificacaoService {
  readonly toasts = signal<Toast[]>([]);
  private seq = 0;

  ok(texto: string) { this.add('ok', texto); }
  erro(texto: string) { this.add('erro', texto); }

  private add(tipo: Toast['tipo'], texto: string) {
    const id = ++this.seq;
    this.toasts.update(t => [...t, { id, tipo, texto }]);
    setTimeout(() => this.toasts.update(t => t.filter(x => x.id !== id)), 5000);
  }
}
