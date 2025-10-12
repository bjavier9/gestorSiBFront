import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '@core/services/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-home-redirect',
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
})
export class HomeRedirectComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  constructor() {
    const user = this.authService.currentUser();
    if (user?.isSuperAdmin) {
      this.router.navigate(['/admin'], { replaceUrl: true });
    } else {
      this.router.navigate(['/dashboard'], { replaceUrl: true });
    }
  }
}
