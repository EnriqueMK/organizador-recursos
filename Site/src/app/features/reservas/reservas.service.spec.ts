import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ReservasService } from '../../core/services/reservas.service';
import { environment } from '../../../environments/environment';

describe('ReservasService', () => {
  let api: ReservasService, http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    api = TestBed.inject(ReservasService);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  it('POST /reservas ao criar', () => {
    api.criar({ recursoId: 1, inicio: 'a', fim: 'b', finalidade: 'aula' }).subscribe();
    const req = http.expectOne(`${environment.apiUrl}/reservas`);
    expect(req.request.method).toBe('POST');
    req.flush({});
  });

  it('POST /reservas/:id/aprovar na transição', () => {
    api.transicionar(5, 'aprovar').subscribe();
    const req = http.expectOne(`${environment.apiUrl}/reservas/5/aprovar`);
    expect(req.request.method).toBe('POST');
    req.flush({});
  });

  it('propaga 409 de dupla reserva', () => {
    let status = 0;
    api.criar({ recursoId: 1, inicio: 'a', fim: 'b', finalidade: 'x' }).subscribe({ error: e => (status = e.status) });
    http.expectOne(`${environment.apiUrl}/reservas`).flush({ detail: 'conflito' }, { status: 409, statusText: 'Conflict' });
    expect(status).toBe(409);
  });
});
