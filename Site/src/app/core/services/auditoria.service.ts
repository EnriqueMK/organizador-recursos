import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { RegistroAuditoria } from '../models/auditoria.model';

@Injectable({ providedIn: 'root' })
export class AuditoriaService {
  private http = inject(HttpClient);
  historico(reservaId: number) {
    return this.http.get<RegistroAuditoria[]>(`${environment.apiUrl}/reservas/${reservaId}/historico`);
  }
}
