import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';

describe('AuthService', () => {
  let auth: AuthService, http: HttpTestingController;

  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
    auth = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  it('guarda a sessão após o login', () => {
    auth.login('a@b.com', '123456').subscribe();
    http.expectOne(`${environment.apiUrl}/auth/login`).flush({
      token: 't', usuario: { id: 1, nome: 'Ana', email: 'a@b.com', perfil: 'RESPONSAVEL' },
    });
    expect(auth.autenticado()).toBeTrue();
    expect(auth.temPerfil('RESPONSAVEL')).toBeTrue();
    expect(auth.temPerfil('ADMINISTRADOR')).toBeFalse();
  });
});
