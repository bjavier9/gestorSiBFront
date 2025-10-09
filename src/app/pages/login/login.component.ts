import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { AuthService, LoginResult } from '../../core/services/auth.service';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-login',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatIconModule,
    NgOptimizedImage
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]]
  });

  loading = signal(false);
  error = signal('');
  hidePassword = signal(true);

  togglePasswordVisibility(event: MouseEvent): void {
    event.stopPropagation();
    this.hidePassword.set(!this.hidePassword());
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      this.loading.set(true);
      this.error.set('');
      const { email, password } = this.loginForm.value;
      this.authService.login(email!, password!).subscribe({
        next: (result: LoginResult) => {
          if (result.isSuperAdmin) {
            this.router.navigate(['/admin/dashboard']);
          } else {
            this.router.navigate(['/dashboard']);
          }
        },
        error: (err: any) => {
          this.error.set('Invalid credentials or connection error');
          this.loading.set(false);
          console.error(err);
        },
        complete: () => {
          this.loading.set(false);
        }
      });
    }
  }
}
