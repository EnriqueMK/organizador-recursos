import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { HttpInterceptorFn, provideHttpClient, withInterceptors } from '@angular/common/http';
import { routes } from './app.routes';
import { environment } from '../environments/environment';
import { authInterceptor } from './core/auth/auth.interceptor';
import { errorInterceptor } from './core/http/error.interceptor';
import { mockBackendInterceptor } from './core/mock/mock-backend.interceptor';

// O mock fica por último: responde no lugar do servidor, mas passa pelo auth e pelo tratamento de erros.
const interceptors: HttpInterceptorFn[] = [authInterceptor, errorInterceptor];
if (environment.useMock) interceptors.push(mockBackendInterceptor);

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(withInterceptors(interceptors)),
  ],
};
