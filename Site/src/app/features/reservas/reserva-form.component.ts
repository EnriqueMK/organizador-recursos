import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { RecursosService } from '../../core/services/recursos.service';
import { ReservasService } from '../../core/services/reservas.service';
import { NotificacaoService } from '../../core/services/notificacao.service';
import { Recurso } from '../../core/models/recurso.model';
import { periodoValido } from '../../shared/validators/periodo.validator';

@Component({
  selector: 'app-reserva-form',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <h2>Nova reserva</h2>
    <form class="card" [formGroup]="form" (ngSubmit)="salvar()">
      <label>Recurso
        <select formControlName="recursoId">
          <option [ngValue]="null" disabled>Selecione…</option>
          @for (r of recursos(); track r.id) {
            <option [ngValue]="r.id" [disabled]="r.emManutencao">
              {{ r.nome }}{{ r.restrito ? ' (requer aprovação)' : '' }}{{ r.emManutencao ? ' — em manutenção' : '' }}
            </option>
          }
        </select>
      </label>
      <label>Início <input type="datetime-local" formControlName="inicio" /></label>
      <label>Fim <input type="datetime-local" formControlName="fim" /></label>
      @if (form.errors?.['fimAntesDoInicio']) { <p class="erro">O término deve ser depois do início.</p> }
      <label>Finalidade <textarea formControlName="finalidade" rows="3"></textarea></label>
      <button type="submit" [disabled]="form.invalid || enviando()">Solicitar reserva</button>
    </form>`,
})
export class ReservaFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private recursosApi = inject(RecursosService);
  private reservasApi = inject(ReservasService);
  private toast = inject(NotificacaoService);
  private router = inject(Router);

  recursos = signal<Recurso[]>([]);
  enviando = signal(false);

  form = this.fb.group({
    recursoId: this.fb.control<number | null>(null, Validators.required),
    inicio: ['', Validators.required],
    fim: ['', Validators.required],
    finalidade: ['', [Validators.required, Validators.maxLength(300)]],
  }, { validators: periodoValido });

  ngOnInit() { this.recursosApi.listar().subscribe(r => this.recursos.set(r)); }

  salvar() {
    if (this.form.invalid) return;
    this.enviando.set(true);
    const v = this.form.getRawValue();
    this.reservasApi.criar({
      recursoId: v.recursoId!,
      inicio: new Date(v.inicio!).toISOString(),
      fim: new Date(v.fim!).toISOString(),
      finalidade: v.finalidade!,
    }).subscribe({
      next: r => { this.toast.ok('Reserva solicitada.'); this.router.navigate(['/reservas', r.id]); },
      // 409 (dupla reserva) e 400 (validação) já são notificados pelo errorInterceptor.
      error: () => this.enviando.set(false),
    });
  }
}
