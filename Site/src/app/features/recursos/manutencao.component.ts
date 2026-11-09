import { Component, Input, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RecursosService } from '../../core/services/recursos.service';
import { NotificacaoService } from '../../core/services/notificacao.service';
import { PeriodoManutencao } from '../../core/models/recurso.model';
import { periodoValido } from '../../shared/validators/periodo.validator';

@Component({
  selector: 'app-manutencao',
  standalone: true,
  imports: [ReactiveFormsModule, DatePipe],
  template: `
    <h2>Manutenção do recurso #{{ id }}</h2>
    <form class="card" [formGroup]="form" (ngSubmit)="salvar()">
      <label>Início <input type="datetime-local" formControlName="inicio" /></label>
      <label>Fim <input type="datetime-local" formControlName="fim" /></label>
      @if (form.errors?.['fimAntesDoInicio']) { <p class="erro">O término deve ser depois do início.</p> }
      <label>Motivo <input formControlName="motivo" /></label>
      <button [disabled]="form.invalid">Registrar período</button>
    </form>

    <table class="tabela">
      <thead><tr><th>Início</th><th>Fim</th><th>Motivo</th></tr></thead>
      <tbody>
        @for (p of periodos(); track p.id) {
          <tr><td>{{ p.inicio | date:'dd/MM/yyyy HH:mm' }}</td><td>{{ p.fim | date:'dd/MM/yyyy HH:mm' }}</td><td>{{ p.motivo }}</td></tr>
        } @empty { <tr><td colspan="3" class="vazio">Nenhum período registrado.</td></tr> }
      </tbody>
    </table>`,
})
export class ManutencaoComponent implements OnInit {
  @Input() id!: string;
  private fb = inject(FormBuilder);
  private api = inject(RecursosService);
  private toast = inject(NotificacaoService);
  periodos = signal<PeriodoManutencao[]>([]);

  form = this.fb.nonNullable.group(
    { inicio: ['', Validators.required], fim: ['', Validators.required], motivo: ['', Validators.required] },
    { validators: periodoValido },
  );

  ngOnInit() { this.carregar(); }
  private carregar() { this.api.manutencoes(+this.id).subscribe(p => this.periodos.set(p)); }

  salvar() {
    const v = this.form.getRawValue();
    this.api.registrarManutencao(+this.id, {
      inicio: new Date(v.inicio).toISOString(), fim: new Date(v.fim).toISOString(), motivo: v.motivo,
    }).subscribe(() => { this.toast.ok('Período registrado.'); this.form.reset(); this.carregar(); });
  }
}
