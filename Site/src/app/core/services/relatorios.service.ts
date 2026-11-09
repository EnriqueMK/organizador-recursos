import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { RelatorioUtilizacao } from '../models/relatorio.model';

@Injectable({ providedIn: 'root' })
export class RelatoriosService {
  private http = inject(HttpClient);
  utilizacao(inicio: string, fim: string) {
    return this.http.get<RelatorioUtilizacao>(`${environment.apiUrl}/relatorios/utilizacao`, {
      params: { inicio, fim },
    });
  }
}
