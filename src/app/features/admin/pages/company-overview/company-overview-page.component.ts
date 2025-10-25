import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { AsyncPipe, NgClass } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { BehaviorSubject, map, of, startWith, switchMap } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { CompanyService } from '@core/services/company.service';
import { OfficeService } from '@core/services/office.service';
import { Company } from '@core/models/company.model';
import { Office } from '@core/models/office.model';
import { BreadcrumbsComponent } from '@features/shared/components/breadcrumbs/breadcrumbs.component';
import { ConfirmDialogComponent } from '@features/shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-company-overview-page',
  standalone: true,
  imports: [
    AsyncPipe,
    RouterLink,
    NgClass,
    BreadcrumbsComponent,
    ConfirmDialogComponent,
  ],
  templateUrl: './company-overview-page.component.html',
  styleUrls: ['./company-overview-page.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CompanyOverviewPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly companyService = inject(CompanyService);
  private readonly officeService = inject(OfficeService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly refresh$ = new BehaviorSubject<void>(undefined);
  private readonly companyIdFromRoute = this.route.snapshot.paramMap.get('companyId') ?? '';

  private readonly companyId$ = this.route.paramMap.pipe(
    map((params) => params.get('companyId') ?? '')
  );

  readonly feedback = signal<{ text: string; tone: 'success' | 'error' } | null>(null);
  readonly isUpdatingStatus = signal(false);
  readonly companyError = signal<string | null>(null);
  readonly officesError = signal<string | null>(null);
  readonly officesFeedback = signal<{ text: string; tone: 'success' | 'error' } | null>(null);
  readonly officeLoadingState = signal<Record<string, boolean>>({});
  readonly pendingCompanyAction = signal<{ company: Company; nextStatus: boolean } | null>(null);
  readonly pendingOfficeAction = signal<{ office: Office; nextStatus: boolean } | null>(null);
  readonly companyConfirmDescription = computed(() => {
    const pending = this.pendingCompanyAction();
    if (!pending) {
      return '';
    }
    const action = pending.nextStatus ? 'Activate' : 'Deactivate';
    return `${action} the company ${pending.company.name}. This will update the company visibility across the platform.`;
  });
  readonly companyConfirmActionText = computed(() => {
    const pending = this.pendingCompanyAction();
    if (!pending) {
      return 'Confirm';
    }
    return pending.nextStatus ? 'Activate company' : 'Deactivate company';
  });
  readonly officeConfirmDescription = computed(() => {
    const pending = this.pendingOfficeAction();
    if (!pending) {
      return '';
    }
    const action = pending.nextStatus ? 'Activate' : 'Deactivate';
    return `${action} the office ${pending.office.nombre}. Users will immediately see the updated availability.`;
  });
  readonly officeConfirmActionText = computed(() => {
    const pending = this.pendingOfficeAction();
    if (!pending) {
      return 'Confirm';
    }
    return pending.nextStatus ? 'Activate office' : 'Deactivate office';
  });
  readonly officeConfirmBusy = computed(() => {
    const pending = this.pendingOfficeAction();
    if (!pending) {
      return false;
    }
    return this.isOfficeUpdating(pending.office.id);
  });

  readonly company$ = this.companyId$.pipe(
    switchMap((companyId) =>
      this.refresh$.pipe(
        switchMap(() => {
          if (!companyId) {
            this.companyError.set('No fue posible determinar el identificador de la compania.');
            return of(undefined);
          }

          this.companyError.set(null);

          return this.companyService.getCompanyById(companyId).pipe(
            startWith(undefined),
            catchError((error) => {
              console.error('Failed to load company', error);

              const errorMessage =
                error?.error?.body?.error?.message ||
                'No se pudo obtener la informacion de la compania. Intenta nuevamente.';

              this.companyError.set(errorMessage);
              return of(undefined);
            })
          );
        })
      )
    )
  );
  readonly skeletonRows = Array.from({ length: 3 });
  readonly skeletonActions = Array.from({ length: 3 });
  readonly officesSkeleton = Array.from({ length: 3 });

  readonly offices$ = this.companyId$.pipe(
    switchMap((companyId) =>
      this.refresh$.pipe(
        switchMap(() => {
          if (!companyId) {
            this.officesError.set('Missing company identifier.');
            return of([]);
          }

          this.officesError.set(null);

          return this.officeService.getCompanyOffices(companyId).pipe(
            startWith(undefined),
            catchError((error) => {
              console.error('Failed to load company offices', error);
              this.officesError.set('Unable to load the offices. Please try again.');
              return of([]);
            })
          );
        })
      )
    )
  );

  requestCompanyStatusChange(company: Company): void {
    if (this.isUpdatingStatus()) {
      return;
    }

    this.feedback.set(null);
    this.pendingCompanyAction.set({
      company,
      nextStatus: !company.isActive,
    });
  }

  confirmCompanyStatusChange(): void {
    const pending = this.pendingCompanyAction();

    if (!pending || this.isUpdatingStatus()) {
      return;
    }

    const { company, nextStatus } = pending;
    this.isUpdatingStatus.set(true);
    this.feedback.set(null);

    this.companyService
      .setCompanyStatus(company.id, nextStatus)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError((error) => {
          console.error('Failed to update company status', error);
          this.feedback.set({
            text: 'Unable to update the company status. Please try again.',
            tone: 'error',
          });
          this.pendingCompanyAction.set(null);
          return of(null);
        }),
        finalize(() => this.isUpdatingStatus.set(false)),
      )
      .subscribe((result) => {
        if (result === null) {
          this.pendingCompanyAction.set(null);
          return;
        }

        this.feedback.set({
          text: `Company ${nextStatus ? 'activated' : 'deactivated'} successfully.`,
          tone: 'success',
        });
        this.pendingCompanyAction.set(null);
        this.refresh$.next(undefined);
      });
  }

  cancelCompanyStatusChange(): void {
    if (!this.pendingCompanyAction()) {
      return;
    }

    this.pendingCompanyAction.set(null);
    this.feedback.set({
      text: 'Accion cancelada por el usuario.',
      tone: 'error',
    });
  }

  requestOfficeStatusChange(office: Office): void {
    if (this.isOfficeUpdating(office.id)) {
      return;
    }

    this.officesFeedback.set(null);
    this.pendingOfficeAction.set({
      office,
      nextStatus: !office.activo,
    });
  }

  confirmOfficeStatusChange(): void {
    const pending = this.pendingOfficeAction();

    if (!pending) {
      return;
    }

    const { office, nextStatus } = pending;

    if (this.isOfficeUpdating(office.id)) {
      return;
    }

    this.officesFeedback.set(null);
    this.setOfficeLoading(office.id, true);

    this.officeService
      .updateOffice(this.companyIdFromRoute || office.companiaCorretajeId, office.id, {
        nombre: office.nombre,
        direccion: office.direccion,
        telefono: office.telefono,
        moneda: office.moneda,
        activo: nextStatus,
      })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError((error) => {
          console.error('Failed to update office status', error);
          this.officesFeedback.set({
            text: 'Unable to update the office status. Please try again.',
            tone: 'error',
          });
          this.pendingOfficeAction.set(null);
          return of(null);
        }),
        finalize(() => {
          this.setOfficeLoading(office.id, false);
        }),
      )
      .subscribe((result) => {
        if (!result) {
          this.pendingOfficeAction.set(null);
          return;
        }

        this.officesFeedback.set({
          text: `Office ${nextStatus ? 'activated' : 'deactivated'} successfully.`,
          tone: 'success',
        });
        this.pendingOfficeAction.set(null);
        this.refresh$.next(undefined);
      });
  }

  cancelOfficeStatusChange(): void {
    if (!this.pendingOfficeAction()) {
      return;
    }

    this.officesFeedback.set({
      text: 'Accion cancelada por el usuario.',
      tone: 'error',
    });
    this.pendingOfficeAction.set(null);
  }

  isOfficeUpdating(officeId: string): boolean {
    return this.officeLoadingState()[officeId] ?? false;
  }

  private setOfficeLoading(officeId: string, isLoading: boolean): void {
    this.officeLoadingState.update((current) => ({
      ...current,
      [officeId]: isLoading,
    }));
  }
}
