import { Component, Input, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { RecursosService } from '../../core/services/recursos.service';
import { Disponibilidade } from '../../core/models/recurso.model';
import { periodoValido } from '../../shared/validators/periodo.validator';
import { DuracaoPipe } from '../../shared/pipes/duracao.pipe';

@Component({
  selector: 'app-disponibilidade',
  standalone: true,
  imports: [ReactiveFormsModule, DatePipe, DuracaoPipe, RouterLink],
  template: `
    <h2>Disponibilidade do recurso #{{ id }}</h2>
    <form class="card filtros" [formGroup]="form" (ngSubmit)="consultar()">
      <label>De <input type="datetime-local" formControlName="inicio" /></label>
      <label>Até <input type="datetime-local" formControlName="fim" /></label>
      <button [disabled]="form.invalid">Consultar</button>
    </form>
    @if (form.errors?.['fimAntesDoInicio']) { <p class="erro">O término deve ser depois do início.</p> }

    @if (disp(); as d) {
      <table class="tabela">
        <thead><tr><th>Início</th><th>Fim</th><th>Duração</th></tr></thead>
        <tbody>
          @for (s of d.livres; track s.inicio) {
            <tr>
              <td>{{ s.inicio | date:'dd/MM HH:mm' }}</td>
              <td>{{ s.fim | date:'dd/MM HH:mm' }}</td>
              <td>{{ s.inicio | duracao:s.fim }}</td>
            </tr>
          } @empty { <tr><td colspan="3" class="vazio">Sem janelas livres no período.</td></tr> }
        </tbody>
      </table>
      <div class="acoes"><a class="btn" routerLink="/reservas/nova">Reservar</a></div>
    }`,
})
export class DisponibilidadeComponent {
  @Input() id!: string;
  private fb = inject(FormBuilder);
  private api = inject(RecursosService);
  disp = signal<Disponibilidade | null>(null);

  form = this.fb.nonNullable.group(
    { inicio: ['', Validators.required], fim: ['', Validators.required] },
    { validators: periodoValido },
  );

  consultar() {
    const v = this.form.getRawValue();
    this.api.disponibilidade(+this.id, new Date(v.inicio).toISOString(), new Date(v.fim).toISOString())
      .subscribe(d => this.disp.set(d));
  }
}
