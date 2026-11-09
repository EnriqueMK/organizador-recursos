import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { AcaoReserva, NovaReserva, Reserva } from '../models/reserva.model';

@Injectable({ providedIn: 'root' })
export class ReservasService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/reservas`;

  listar(filtro: { minhas?: boolean; estado?: string } = {}) {
    const params: Record<string, string> = {};
    if (filtro.minhas) params['minhas'] = 'true';
    if (filtro.estado) params['estado'] = filtro.estado;
    return this.http.get<Reserva[]>(this.base, { params });
  }
  obter(id: number) { return this.http.get<Reserva>(`${this.base}/${id}`); }
  criar(dto: NovaReserva) { return this.http.post<Reserva>(this.base, dto); }
  alterar(id: number, dto: NovaReserva) { return this.http.put<Reserva>(`${this.base}/${id}`, dto); }
  transicionar(id: number, acao: AcaoReserva, motivo?: string) {
    return this.http.post<Reserva>(`${this.base}/${id}/${acao}`, { motivo });
  }
}
