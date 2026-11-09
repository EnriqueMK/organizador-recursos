import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { RelatoriosService } from '../../core/services/relatorios.service';
import { RelatorioUtilizacao } from '../../core/models/relatorio.model';
import { periodoValido } from '../../shared/validators/periodo.validator';

@Component({
  selector: 'app-relatorio-utilizacao',
  standalone: true,
  imports: [ReactiveFormsModule, DecimalPipe],
  template: `
    <h2>Relatório de utilização</h2>
    <form class="card filtros" [formGroup]="form" (ngSubmit)="gerar()">
      <label>Início <input type="datetime-local" formControlName="inicio" /></label>
      <label>Fim <input type="datetime-local" formControlName="fim" /></label>
      <button [disabled]="form.invalid">Gerar</button>
    </form>
    @if (form.errors?.['fimAntesDoInicio']) { <p class="erro">O término deve ser depois do início.</p> }

    @if (rel(); as r) {
      <section class="grid">
        <div class="card kpi"><strong>{{ r.conflitosEvitados }}</strong><span>conflitos evitados</span></div>
      </section>
      <h3>Horas reservadas por recurso</h3>
      <table class="tabela">
        <tbody>
          @for (x of r.horasPorRecurso; track x.recursoId) {
            <tr><td>{{ x.recursoNome }}</td><td>{{ x.horas | number:'1.0-2' }} h</td></tr>
          } @empty { <tr><td class="vazio">Nenhuma reserva no período.</td></tr> }
        </tbody>
      </table>
      <h3>Carga horária por professor</h3>
      <table class="tabela">
        <tbody>
          @for (x of r.cargaPorProfessor; track x.professorId) {
            <tr><td>{{ x.professorNome }}</td><td>{{ x.horas | number:'1.0-2' }} h</td></tr>
          } @empty { <tr><td class="vazio">Sem carga alocada.</td></tr> }
        </tbody>
      </table>
    }`,
})
export class RelatorioUtilizacaoComponent {
  private fb = inject(FormBuilder);
  private api = inject(RelatoriosService);
  rel = signal<RelatorioUtilizacao | null>(null);

  form = this.fb.nonNullable.group(
    { inicio: ['', Validators.required], fim: ['', Validators.required] },
    { validators: periodoValido },
  );

  gerar() {
    const v = this.form.getRawValue();
    this.api.utilizacao(new Date(v.inicio).toISOString(), new Date(v.fim).toISOString())
      .subscribe(r => this.rel.set(r));
  }
}
