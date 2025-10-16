import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '@core/services/auth.service';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule],
  template: `
    <div class="flex h-screen flex-col items-center justify-center bg-slate-100 text-slate-900">
      <h1 class="mb-4 text-2xl font-semibold">
        Welcome, {{ authService.currentUser()?.email }}!
      </h1>
      <button
        type="button"
        class="inline-flex items-center gap-2 rounded-full bg-rose-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-rose-700"
        (click)="authService.logout()"
      >
        <span aria-hidden="true">⎋</span>
        Logout
      </button>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardComponent {
  protected authService = inject(AuthService);
}

