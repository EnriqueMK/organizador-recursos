import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthService } from './core/auth/auth.service';
import { NavbarComponent } from './shared/components/navbar/navbar.component';
import { ToastComponent } from './shared/components/toast/toast.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent, ToastComponent],
  template: `
    @if (auth.autenticado()) { <app-navbar /> }
    <main class="container"><router-outlet /></main>
    <app-toast />`,
})
export class AppComponent { auth = inject(AuthService); }
