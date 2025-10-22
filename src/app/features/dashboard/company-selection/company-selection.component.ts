import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { AuthService } from '@core/services/auth.service';
import { CompanyAssociation } from '@core/models/auth.model';
import {
  BreadcrumbItem,
  BreadcrumbsComponent,
} from '@features/admin/components/breadcrumbs/breadcrumbs.component';

@Component({
  selector: 'app-company-selection',
  standalone: true,
  imports: [CommonModule, BreadcrumbsComponent],
  templateUrl: './company-selection.component.html',
  styleUrls: ['./company-selection.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CompanySelectionComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly breadcrumbs: BreadcrumbItem[] = [
    { label: 'Cuenta', link: ['/dashboard'] },
    { label: 'Seleccionar compania' },
  ];

  readonly companies = computed<CompanyAssociation[]>(() => this.authService.pendingCompanies());
  readonly isInitializing = signal(true);
  readonly isSelecting = signal(false);
  readonly error = signal<string | null>(null);
  readonly skeletonCards = Array.from({ length: 3 });

  ngOnInit(): void {
    if (!this.authService.needsCompanySelection()) {
      this.router.navigate(['/dashboard']);
      return;
    }

    if (this.companies().length === 0) {
      this.error.set('No hay companias pendientes. Inicia sesion nuevamente.');
    }

    Promise.resolve().then(() => this.isInitializing.set(false));
  }

  trackCompany(_: number, company: CompanyAssociation): string {
    return company.id ?? company.companiaCorretajeId ?? String(_);
  }

  selectCompany(companiaId: string): void {
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
}
