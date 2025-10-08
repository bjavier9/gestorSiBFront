import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { AuthService } from '../core/services/auth.service';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, MatButtonModule],
  template: `
    <div class="dashboard-container">
      <h1>Welcome, {{ authService.currentUser()?.email }}!</h1>
      <button mat-raised-button color="warn" (click)="authService.logout()">Logout</button>
    </div>
  `,
  styles: [`
    .dashboard-container {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      height: 100vh;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardComponent {
  protected authService = inject(AuthService);
}
