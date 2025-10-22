import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { NgClass } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { catchError, finalize, of } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { CompanyService } from '@core/services/company.service';
import { CompanyFromApi } from '@core/models/company.model';
import {
  BreadcrumbItem,
  BreadcrumbsComponent,
} from '@features/admin/components/breadcrumbs/breadcrumbs.component';

@Component({
  selector: 'app-company-create-page',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, NgClass, BreadcrumbsComponent],
  templateUrl: './company-create-page.component.html',
  styleUrls: ['./company-create-page.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CompanyCreatePageComponent {
  private static readonly allowedLogoMimeTypes = new Set([
    'image/png',
    'image/jpeg',
    'image/gif',
    'image/svg+xml',
  ]);

  private static readonly allowedLogoExtensions = new Set(['png', 'jpg', 'jpeg', 'gif', 'svg']);
  private static readonly maxLogoSizeBytes = 300 * 1024; // 300 KB

  private readonly formBuilder = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly companyService = inject(CompanyService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly defaultLogo = 'noimagen.svg';

  readonly breadcrumbs: BreadcrumbItem[] = [
    { label: 'Companies', link: ['/admin/companies'] },
    { label: 'Create company' },
  ];

  readonly form = this.formBuilder.group({
    name: ['', Validators.required],
    taxId: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', Validators.required],
    address: [''],
  });

  readonly feedback = signal<{ text: string; tone: 'success' | 'error' } | null>(null);
  readonly isSubmitting = signal(false);
  readonly isLoading = signal(true);
  readonly logoPreview = signal(this.defaultLogo);
  readonly logoError = signal<string | null>(null);
  readonly logoState = signal<'default' | 'custom'>('default');
  readonly skeletonFields = Array.from({ length: 5 });
  readonly skeletonActions = Array.from({ length: 2 });

  private logoPayload: string | null = null;

  constructor() {
    // Show the placeholder during the first render to keep transitions consistent.
    Promise.resolve().then(() => this.isLoading.set(false));
  }

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

    if (this.logoState() === 'custom') {
      payload.logo = this.logoPayload ?? '';
    }

    this.isSubmitting.set(true);
    this.feedback.set(null);

    this.companyService
      .createCompany(payload)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError((error) => {
          console.error('Failed to create company', error);
          this.feedback.set({
            text:
              error?.error?.body?.error?.message ??
              'Unable to create the company. Please try again.',
            tone: 'error',
          });
          return of(null);
        }),
        finalize(() => this.isSubmitting.set(false)),
      )
      .subscribe((company) => {
        if (!company) {
          return;
        }

        this.feedback.set({
          text: 'Company created successfully.',
          tone: 'success',
        });

        this.router.navigate(['/admin/companies', company.id]);
      });
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

    if (file.size > CompanyCreatePageComponent.maxLogoSizeBytes) {
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
      this.logoState.set('custom');
      this.logoError.set(null);
    };

    reader.onerror = () => {
      this.logoError.set('Could not read the selected image. Please try again.');
    };

    reader.readAsDataURL(file);
  }

  removeLogo(): void {
    this.logoPreview.set(this.defaultLogo);
    this.logoPayload = null;
    this.logoState.set('default');
    this.logoError.set(null);
  }

  handlePreviewError(): void {
    this.logoPreview.set(this.defaultLogo);
  }

  private isAllowedLogo(file: File): boolean {
    const mimeType = file.type.toLowerCase();
    if (CompanyCreatePageComponent.allowedLogoMimeTypes.has(mimeType)) {
      return true;
    }

    const extension = file.name.split('.').pop()?.toLowerCase() ?? '';
    return CompanyCreatePageComponent.allowedLogoExtensions.has(extension);
  }
}
