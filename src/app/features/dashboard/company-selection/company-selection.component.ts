import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { AuthService } from '@core/services/auth.service';
import { CompanyAssociation } from '@core/models/auth.model';

@Component({
  selector: 'app-company-selection',
  standalone: true,
  imports: [CommonModule, NgOptimizedImage],
  templateUrl: './company-selection.component.html',
  styleUrls: ['company-selection.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CompanySelectionComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly companies = computed(() => this.authService.pendingCompanies());
  readonly isInitializing = signal(true);
  readonly isSelecting = signal(false);
  readonly error = signal<string | null>(null);
  readonly skeletonCards = Array.from({ length: 3 });

  ngOnInit(): void {
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login']);
      return;
    }

    if (!this.authService.needsCompanySelection()) {
      this.router.navigate(['/dashboard']);
      return;
    }

    if (this.companies().length === 0) {
      this.loadPendingAssociations();
    } else {
      this.isInitializing.set(false);
    }
  }

  trackCompany(_: number, company: CompanyAssociation): string {
    return company?.compania?.id ?? String(_);
  }

  selectCompany(company: CompanyAssociation): void {
    const companiaId = company?.compania?.id;
    if (!companiaId || this.isSelecting()) {
      return;
    }

    this.isSelecting.set(true);
    this.error.set(null);

    this.authService
      .selectCompany(companiaId)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isSelecting.set(false))
      )
      .subscribe({
        next: (user) => {
          const targetRoute = user.isSuperAdmin ? '/admin/companies' : '/dashboard';
          this.router.navigate([targetRoute]);
        },
        error: (err: unknown) => {
          console.error('Company selection error', err);
          this.error.set('No se pudo completar la seleccion. Intenta nuevamente.');
        },
      });
  }

  logout(): void {
    this.authService.logout();
  }

  private loadPendingAssociations(): void {
    this.isInitializing.set(true);
    this.error.set(null);

    this.authService
      .loadPendingCompanies()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isInitializing.set(false))
      )
      .subscribe({
        next: (associations) => {
          if (!associations.length) {
            this.error.set('No se encontraron companias activas. Cierra sesion e inicia nuevamente.');
          }
        },
        error: (err: unknown) => {
          console.error('Failed to load pending companies', err);
          this.error.set('No se pudieron cargar las companias. Cierra sesion e inicia nuevamente.');
        },
      });
  }
}
