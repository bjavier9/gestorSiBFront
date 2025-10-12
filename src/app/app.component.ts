import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { AuthService } from '@core/services/auth.service';
import { ThemeToggleComponent } from '@shared/components/theme-toggle/theme-toggle.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  imports: [RouterOutlet, MatToolbarModule, MatButtonModule, MatIconModule, ThemeToggleComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent implements OnInit {
  private authService = inject(AuthService);
  isLoggedIn = this.authService.isLoggedIn;

  ngOnInit(): void {
    // El constructor de AuthService ya se encarga de la lógica de autenticación inicial.
    // No se necesita código adicional aquí a menos que quieras realizar acciones específicas
    // en el AppComponent cuando el estado de autenticación cambie.
  }

  logout(): void {
    this.authService.logout();
  }
}
