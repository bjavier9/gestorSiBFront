import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { AsyncPipe, NgClass, NgFor, NgIf } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { tap } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, finalize, of } from 'rxjs';

import { CompanyService } from '@core/services/company.service';
import { CompanyFromApi } from '@core/models/company.model';

@Component({
  selector: 'app-company-edit-page',
  standalone: true,
  imports: [ReactiveFormsModule, NgIf, NgFor, AsyncPipe, RouterLink, NgClass],
  templateUrl: './company-edit-page.component.html',
  styleUrls: ['./company-edit-page.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CompanyEditPageComponent {
  private static readonly allowedLogoMimeTypes = new Set([
    'image/png',
    'image/jpeg',
    'image/gif',
    'image/svg+xml',
  ]);

  private static readonly allowedLogoExtensions = new Set(['png', 'jpg', 'jpeg', 'gif', 'svg']);
  private static readonly maxLogoSizeBytes = 300 * 1024; // 300 KB

  private readonly formBuilder = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly companyService = inject(CompanyService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly defaultLogo = 'noimagen.svg';

  readonly companyId = this.route.snapshot.paramMap.get('companyId') ?? '';
  readonly form = this.formBuilder.group({
    name: ['', Validators.required],
    taxId: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', Validators.required],
    address: [''],
  });

  readonly feedback = signal<{ text: string; tone: 'success' | 'error' } | null>(null);
  readonly isSubmitting = signal(false);
  readonly logoPreview = signal(this.defaultLogo);
  readonly logoError = signal<string | null>(null);
  readonly logoState = signal<'unchanged' | 'new' | 'removed'>('unchanged');
  readonly confirmationMessage = signal<string | null>(null);
  readonly isConfirmationOpen = signal(false);
  readonly skeletonFields = Array.from({ length: 5 });
  readonly skeletonActions = Array.from({ length: 2 });

  private originalLogo: string | null = null;
  private logoPayload: string | null = null;
  private pendingUpdatePayload: Partial<CompanyFromApi> | null = null;

  readonly company$ = this.companyService
    .getCompanyById(this.companyId)
    .pipe(
      tap((company) => {
        if (!company) {
          return;
        }

        this.form.patchValue({
          name: company.name,
          taxId: company.taxId,
          email: company.email,
          phone: company.phone,
          address: company.address,
        });

        this.resetLogoState(company.logo);
      }),
    );

  submit(): void {
    if (this.form.invalid) {
      this.feedback.set({
        text: 'Please fill in the required fields.',
        tone: 'error',
      });
      return;
    }

    const value = this.form.getRawValue();
    const payload: Partial<CompanyFromApi> = {
      nombre: value.name?.trim() ?? '',
      rif: value.taxId?.trim() ?? '',
      correo: value.email?.trim() ?? '',
      telefono: value.phone?.trim() ?? '',
      direccion: value.address?.trim() ?? '',
    };

    if (this.logoState() === 'new') {
      payload.logo = this.logoPayload ?? '';
    } else if (this.logoState() === 'removed') {
      payload.logo = '';
    }

    this.pendingUpdatePayload = payload;
    this.confirmationMessage.set(
      'Are you sure you want to save these changes for this company?'
    );
    this.isConfirmationOpen.set(true);
  }

  onLogoSelected(event: Event): void {
    const input = event.target as HTMLInputElement | null;
    if (!input) {
      return;
    }

    const [file] = Array.from(input.files ?? []);
    input.value = '';

    if (!file) {
      return;
    }

    if (!this.isAllowedLogo(file)) {
      this.logoError.set('Invalid file type. Please upload a PNG, JPG, JPEG, GIF, or SVG image.');
      return;
    }

    if (file.size > CompanyEditPageComponent.maxLogoSizeBytes) {
      this.logoError.set('Logo size is too large. Please use an image under 300 KB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : null;
      if (!result) {
        this.logoError.set('Could not read the selected image. Please try again.');
        return;
      }

      this.logoPreview.set(result);
      this.logoPayload = result;
      this.logoState.set('new');
      this.logoError.set(null);
    };

    reader.onerror = () => {
      this.logoError.set('Could not read the selected image. Please try again.');
    };

    reader.readAsDataURL(file);
  }

  removeLogo(): void {
    this.logoPreview.set(this.defaultLogo);
    this.logoPayload = '';
    this.logoState.set('removed');
    this.logoError.set(null);
  }

  resetLogoChanges(): void {
    this.logoPreview.set(this.originalLogo ?? this.defaultLogo);
    this.logoPayload = null;
    this.logoState.set('unchanged');
    this.logoError.set(null);
  }

  handlePreviewError(): void {
    this.logoPreview.set(this.defaultLogo);
  }

  private resetLogoState(logo?: string | null): void {
    this.originalLogo = logo ?? null;
    this.logoPreview.set(this.originalLogo ?? this.defaultLogo);
    this.logoPayload = null;
    this.logoState.set('unchanged');
    this.logoError.set(null);
  }

  private isAllowedLogo(file: File): boolean {
    const mimeType = file.type.toLowerCase();
    if (CompanyEditPageComponent.allowedLogoMimeTypes.has(mimeType)) {
      return true;
    }

    const extension = file.name.split('.').pop()?.toLowerCase() ?? '';
    return CompanyEditPageComponent.allowedLogoExtensions.has(extension);
  }

  confirmPendingUpdate(): void {
    const payload = this.pendingUpdatePayload;
    if (!payload || this.isSubmitting()) {
      return;
    }

    this.isConfirmationOpen.set(false);
    this.executeUpdate(payload);
  }

  cancelPendingUpdate(): void {
    if (!this.pendingUpdatePayload) {
      this.isConfirmationOpen.set(false);
      return;
    }

    this.pendingUpdatePayload = null;
    this.isConfirmationOpen.set(false);
    this.feedback.set({
      text: 'Action cancelled by the user.',
      tone: 'error',
    });
  }

  private executeUpdate(payload: Partial<CompanyFromApi>): void {
    this.isSubmitting.set(true);
    this.feedback.set(null);

    this.companyService
      .updateCompany(this.companyId, payload)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError((error) => {
          console.error('Failed to update company', error);
          this.feedback.set({
            text:
              error?.error?.body?.error?.message ??
              'Unable to update the company. Please try again.',
            tone: 'error',
          });
          this.pendingUpdatePayload = null;
          return of(null);
        }),
        finalize(() => this.isSubmitting.set(false)),
      )
      .subscribe((company) => {
        if (!company) {
          return;
        }

        this.pendingUpdatePayload = null;
        this.router.navigate(['/admin/companies', this.companyId]);
      });
  }
}
