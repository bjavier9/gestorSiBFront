import { AsyncPipe, NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';

import { OfficeService } from '@core/services/office.service';
import { CompanyService } from '@core/services/company.service';
import { Office, UpdateOfficeRequest } from '@core/models/office.model';
import { BreadcrumbsComponent } from '@features/shared/components/breadcrumbs/breadcrumbs.component';

@Component({
  selector: 'app-company-office-edit-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    AsyncPipe,
    NgClass,
    RouterLink,
    BreadcrumbsComponent,
  ],
  templateUrl: './company-office-edit-page.component.html',
  styleUrls: ['../company-offices/company-offices-page.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CompanyOfficeEditPageComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly officeService = inject(OfficeService);
  private readonly companyService = inject(CompanyService);
  private readonly destroyRef = inject(DestroyRef);

  readonly companyId = this.route.snapshot.paramMap.get('companyId') ?? '';
  readonly officeId = this.route.snapshot.paramMap.get('officeId') ?? '';

  readonly form = this.formBuilder.group({
    name: ['', Validators.required],
    address: ['', Validators.required],
    phone: ['', Validators.required],
    currency: [''],
    active: [true],
  });

  readonly feedback = signal<{ text: string; tone: 'success' | 'error' } | null>(null);
  readonly isSubmitting = signal(false);
  readonly isLoadingOffice = signal(true);
  readonly loadError = signal<string | null>(null);
  readonly currentOffice = signal<Office | null>(null);

  readonly company$ = this.companyId
    ? this.companyService.getCompanyById(this.companyId)
    : of(undefined);

  constructor() {
    this.fetchOffice();
  }

  submit(): void {
    if (this.form.invalid) {
      this.feedback.set({
        text: 'Please review the required fields.',
        tone: 'error',
      });
      return;
    }

    const existingOffice = this.currentOffice();

    if (!existingOffice) {
      this.feedback.set({
        text: 'Office data is not available yet. Please wait a moment and try again.',
        tone: 'error',
      });
      return;
    }

    const value = this.form.getRawValue();
    const payload: UpdateOfficeRequest = {
      nombre: value.name?.trim() ?? existingOffice.nombre,
      direccion: value.address?.trim() ?? existingOffice.direccion,
      telefono: value.phone?.trim() ?? existingOffice.telefono,
      moneda: value.currency?.trim() || existingOffice.moneda,
      activo: value.active ?? existingOffice.activo,
    };

    this.isSubmitting.set(true);
    this.feedback.set(null);

    this.officeService
      .updateOffice(this.companyId, this.officeId, payload)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError((error) => {
          console.error('Failed to update office', error);
          const errorMessage =
            error?.error?.body?.message ||
            'Unable to update the office. Please review the information and try again.';
          this.feedback.set({
            text: errorMessage,
            tone: 'error',
          });
          return of(null);
        }),
        finalize(() => this.isSubmitting.set(false)),
      )
      .subscribe((office) => {
        if (!office) {
          return;
        }

        this.currentOffice.set(office);
        this.form.reset({
          name: office.nombre,
          address: office.direccion,
          phone: office.telefono,
          currency: office.moneda,
          active: office.activo,
        });
        this.feedback.set({
          text: 'Office updated successfully.',
          tone: 'success',
        });
      });
  }

  resetForm(): void {
    const office = this.currentOffice();

    if (!office) {
      return;
    }

    this.form.reset({
      name: office.nombre,
      address: office.direccion,
      phone: office.telefono,
      currency: office.moneda,
      active: office.activo,
    });
    this.feedback.set(null);
  }

  private fetchOffice(): void {
    if (!this.companyId || !this.officeId) {
      this.loadError.set('Missing office identifier.');
      this.isLoadingOffice.set(false);
      return;
    }

    this.officeService
      .getOfficeById(this.companyId, this.officeId)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError((error) => {
          console.error('Failed to load office', error);
          this.loadError.set('Unable to load the office. Please try again.');
          return of(null);
        }),
        finalize(() => this.isLoadingOffice.set(false)),
      )
      .subscribe((office) => {
        if (!office) {
          return;
        }

        this.currentOffice.set(office);
        this.form.patchValue(
          {
            name: office.nombre,
            address: office.direccion,
            phone: office.telefono,
            currency: office.moneda,
            active: office.activo,
          },
          {
            emitEvent: false,
          }
        );
      });
  }
}
