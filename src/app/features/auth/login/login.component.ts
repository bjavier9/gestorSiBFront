import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { AuthService, LoginResult } from '@core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NgOptimizedImage],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  readonly loading = signal(false);
  readonly error = signal('');
  readonly hidePassword = signal(true);

  ngOnInit(): void {
    if (this.authService.isAuthenticated()) {
      const user = this.authService.currentUser();
      if (user?.requiresCompanySelection) {
        this.router.navigate(['/select-company']);
        return;
      }
      if (user?.isSuperAdmin) {
        this.router.navigate(['/admin/companies']);
      } else {
        this.router.navigate(['/dashboard']);
      }
    }
  }

  togglePasswordVisibility(event: MouseEvent): void {
    event.stopPropagation();
    this.hidePassword.set(!this.hidePassword());
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      return;
    }

    this.loading.set(true);
    this.error.set('');
    const { email, password } = this.loginForm.value;

    this.authService.login(email!, password!).subscribe({
      next: (result: LoginResult) => {
        if (result.needsSelection) {
          this.router.navigate(['/select-company']);
          return;
        }
        const targetRoute = result.isSuperAdmin ? '/admin/companies' : '/dashboard';
        this.router.navigate([targetRoute]);
      },
      error: (err: unknown) => {
        console.error('Login error', err);
        this.error.set('Invalid credentials or connection error.');
        this.loading.set(false);
      },
      complete: () => {
        this.loading.set(false);
      },
    });
  }
}
