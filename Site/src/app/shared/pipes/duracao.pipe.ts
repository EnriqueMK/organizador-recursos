import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'duracao', standalone: true })
export class DuracaoPipe implements PipeTransform {
  transform(inicio: string, fim: string): string {
    const min = Math.round((new Date(fim).getTime() - new Date(inicio).getTime()) / 60000);
    if (min <= 0) return '—';
    const h = Math.floor(min / 60), m = min % 60;
    return h ? (m ? `${h}h${String(m).padStart(2, '0')}` : `${h}h`) : `${m}min`;
  }
}
