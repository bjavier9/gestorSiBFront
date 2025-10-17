import { AsyncPipe, NgClass, NgIf } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { of } from 'rxjs';
import { catchError, finalize, tap } from 'rxjs/operators';

import { OfficeService } from '@core/services/office.service';
import { CompanyService } from '@core/services/company.service';
import { CreateOfficeRequest } from '@core/models/office.model';
import { BreadcrumbsComponent } from '@features/admin/components/breadcrumbs/breadcrumbs.component';

@Component({
  selector: 'app-company-offices-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    NgIf,
    AsyncPipe,
    NgClass,
    RouterLink,
    BreadcrumbsComponent,
  ],
  templateUrl: './company-offices-page.component.html',
  styleUrls: ['./company-offices-page.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CompanyOfficesPageComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly officeService = inject(OfficeService);
  private readonly companyService = inject(CompanyService);
  private readonly destroyRef = inject(DestroyRef);

  readonly companyId = this.route.snapshot.paramMap.get('companyId') ?? '';
  readonly form = this.formBuilder.group({
    name: ['', Validators.required],
    address: ['', Validators.required],
    phone: ['', Validators.required],
    currency: [''],
  });

  readonly feedback = signal<{ text: string; tone: 'success' | 'error' } | null>(null);
  readonly isSubmitting = signal(false);

  readonly company$ = this.companyService
    .getCompanyById(this.companyId)
    .pipe(
      tap((company) => {
        if (company && !this.form.get('currency')?.value) {
          this.form.patchValue({ currency: company.defaultCurrency ?? '' }, { emitEvent: false });
        }
      }),
    );

  submit(): void {
    if (this.form.invalid) {
      this.feedback.set({
        text: 'Please fill in every field.',
        tone: 'error',
      });
      return;
    }

    const value = this.form.getRawValue();
    const payload: CreateOfficeRequest = {
      nombre: value.name?.trim() ?? '',
      direccion: value.address?.trim() ?? '',
      telefono: value.phone?.trim() ?? '',
      moneda: value.currency?.trim() || 'USD',
      activo: true,
    };

    this.isSubmitting.set(true);
    this.feedback.set(null);

    this.officeService
      .createOffice(this.companyId, payload)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError((error) => {
          console.error('Failed to create office', error);
          this.feedback.set({
            text: 'Unable to create the office. Please try again.',
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

        this.feedback.set({
          text: 'Office created successfully.',
          tone: 'success',
        });
        this.form.reset({
          currency: payload.moneda,
        });
      });
  }
}
