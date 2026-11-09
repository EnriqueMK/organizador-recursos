import { AbstractControl, ValidationErrors } from '@angular/forms';

export function periodoValido(group: AbstractControl): ValidationErrors | null {
  const inicio = group.get('inicio')?.value;
  const fim = group.get('fim')?.value;
  if (!inicio || !fim) return null;
  return new Date(fim) <= new Date(inicio) ? { fimAntesDoInicio: true } : null;
}
