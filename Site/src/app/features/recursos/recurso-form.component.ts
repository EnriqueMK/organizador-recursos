import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { RecursosService } from '../../core/services/recursos.service';
import { NotificacaoService } from '../../core/services/notificacao.service';
import { TipoRecurso } from '../../core/models/recurso.model';

@Component({
  selector: 'app-recurso-form',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <h2>Novo recurso</h2>
    <form class="card" [formGroup]="form" (ngSubmit)="salvar()">
      <label>Nome <input formControlName="nome" /></label>
      <label>Tipo
        <select formControlName="tipo">
          @for (t of tipos; track t) { <option [value]="t">{{ t }}</option> }
        </select>
      </label>
      <label>Capacidade <input type="number" min="1" formControlName="capacidade" /></label>
      @if (form.controls.capacidade.invalid && form.controls.capacidade.touched) {
        <p class="erro">A capacidade deve ser um número positivo.</p>
      }
      <label style="grid-auto-flow:column;justify-content:start;align-items:center;gap:.5rem">
        <input type="checkbox" formControlName="restrito" /> Recurso restrito (exige aprovação de um Responsável)
      </label>
      <button type="submit" [disabled]="form.invalid">Salvar</button>
    </form>`,
})
export class RecursoFormComponent {
  private fb = inject(FormBuilder);
  private api = inject(RecursosService);
  private toast = inject(NotificacaoService);
  private router = inject(Router);

  tipos: TipoRecurso[] = ['SALA', 'LABORATORIO', 'EQUIPAMENTO', 'AUDITORIO'];
  form = this.fb.nonNullable.group({
    nome: ['', [Validators.required, Validators.maxLength(100)]],
    tipo: ['SALA' as TipoRecurso, Validators.required],
    capacidade: [1, [Validators.required, Validators.min(1)]],
    restrito: [false],
  });

  salvar() {
    if (this.form.invalid) return;
    this.api.criar(this.form.getRawValue()).subscribe(() => {
      this.toast.ok('Recurso cadastrado.');
      this.router.navigate(['/recursos']);
    });
  }
}
