import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Disponibilidade, PeriodoManutencao, Recurso } from '../models/recurso.model';

@Injectable({ providedIn: 'root' })
export class RecursosService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/recursos`;

  listar() { return this.http.get<Recurso[]>(this.base); }
  criar(r: Omit<Recurso, 'id' | 'emManutencao'>) { return this.http.post<Recurso>(this.base, r); }
  disponibilidade(id: number, inicio: string, fim: string) {
    return this.http.get<Disponibilidade>(`${this.base}/${id}/disponibilidade`, { params: { inicio, fim } });
  }
  manutencoes(id: number) { return this.http.get<PeriodoManutencao[]>(`${this.base}/${id}/manutencoes`); }
  registrarManutencao(id: number, p: Omit<PeriodoManutencao, 'id' | 'recursoId'>) {
    return this.http.post<PeriodoManutencao>(`${this.base}/${id}/manutencoes`, p);
  }
}
