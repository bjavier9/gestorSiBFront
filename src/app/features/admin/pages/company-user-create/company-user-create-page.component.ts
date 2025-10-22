import { AsyncPipe, NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { of, startWith } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';

import { ConfigurationService } from '@core/services/configuration.service';
import { EnteService } from '@core/services/ente.service';
import { OfficeService } from '@core/services/office.service';
import { UserService } from '@core/services/user.service';
import { AuthService } from '@core/services/auth.service';
import { CompanyService } from '@core/services/company.service';
import { ToastService } from '@core/services/toast.service';
import { CreateEnteRequest, EnteMetadataPersonaNatural } from '@core/models/ente.model';
import { Office } from '@core/models/office.model';
import { CompanyUserRole } from '@core/models/company-user.model';
import { RoleOption } from '@core/models/role.model';
import { BreadcrumbsComponent } from '@features/admin/components/breadcrumbs/breadcrumbs.component';
import { ConfirmDialogComponent } from '@features/admin/components/confirm-dialog/confirm-dialog.component';

interface CompanyUserFormValue {
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  role: CompanyUserRole | '' | null;
  documentType: string | null;
  documentNumber: string | null;
  phone: string | null;
  address: string | null;
  regionId: string | null;
  birthdate: string | null;
  gender: 'M' | 'F' | '' | null;
  civilStatus: string | null;
  profession: string | null;
  nationality: string | null;
  children: string | number | null;
  vehicles: string | number | null;
  password: string | null;
  officeId: string | null;
}

@Component({
  selector: 'app-company-user-create-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    AsyncPipe,
    NgClass,
    RouterLink,
    BreadcrumbsComponent,
    ConfirmDialogComponent,
  ],
  templateUrl: './company-user-create-page.component.html',
  styleUrls: ['./company-user-create-page.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CompanyUserCreatePageComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly configurationService = inject(ConfigurationService);
  private readonly enteService = inject(EnteService);
  private readonly officeService = inject(OfficeService);
  private readonly userService = inject(UserService);
  private readonly authService = inject(AuthService);
  private readonly companyService = inject(CompanyService);
  private readonly toastService = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  readonly companyId = (this.route.snapshot.paramMap.get('companyId') ?? '').trim();
  readonly company$ = this.companyService.getCompanyById(this.companyId).pipe(
    startWith(undefined),
    catchError((error) => {
      console.error('Failed to load company context', error);
      return of(null);
    })
  );
  readonly offices$ = this.officeService.getCompanyOffices(this.companyId).pipe(
    startWith(undefined),
    catchError((error) => {
      console.error('Failed to load offices', error);
      return of<Office[]>([]);
    })
  );
  readonly roles$ = this.configurationService.getAvailableRoles().pipe(
    startWith(undefined),
    catchError((error) => {
      console.error('Failed to load roles', error);
      return of<RoleOption[]>([]);
    })
  );

  readonly form = this.formBuilder.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    role: ['', Validators.required],
    documentType: ['', Validators.required],
    documentNumber: ['', Validators.required],
    phone: ['', Validators.required],
    address: ['', Validators.required],
    regionId: [''],
    birthdate: [''],
    gender: ['M'],
    civilStatus: [''],
    profession: [''],
    nationality: [''],
    children: [''],
    vehicles: [''],
    password: [''],
    officeId: [''],
  });

  readonly isSubmitting = signal(false);
  readonly isConfirmationOpen = signal(false);
  readonly confirmationMessage = signal<string | null>(null);
  readonly skeletonFields = Array.from({ length: 8 });
  private readonly requiredFieldMessages: Partial<Record<keyof CompanyUserFormValue, string>> = {
    firstName: 'First name is required.',
    lastName: 'Last name is required.',
    email: 'Email is required.',
    role: 'Select a role.',
    documentType: 'Document type is required.',
    documentNumber: 'Document number is required.',
    phone: 'Phone number is required.',
    address: 'Address is required.',
  };
  private pendingFormValue: CompanyUserFormValue | null = null;

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toastService.showError('Please fill in every required field.');
      return;
    }

    const currentUser = this.authService.currentUser();
    const value = this.form.getRawValue() as CompanyUserFormValue;
    if (currentUser?.isSuperAdmin && !this.companyId) {
      this.toastService.showError(
        'Unable to determine the target company. Please reopen this page from a company context and try again.'
      );
      return;
    }

    this.pendingFormValue = value;
    this.confirmationMessage.set(
      `Are you sure you want to create the user ${value.email?.trim() ?? ''}?`
    );
    this.isConfirmationOpen.set(true);
  }

  confirmPendingCreation(): void {
    if (this.isSubmitting()) {
      return;
    }

    const value = this.pendingFormValue;
    if (!value) {
      this.isConfirmationOpen.set(false);
      return;
    }

    this.isConfirmationOpen.set(false);
    this.confirmationMessage.set(null);
    this.executeUserCreation(value);
  }

  cancelPendingCreation(): void {
    if (!this.pendingFormValue) {
      this.isConfirmationOpen.set(false);
      return;
    }

    this.pendingFormValue = null;
    this.isConfirmationOpen.set(false);
    this.confirmationMessage.set(null);
  }

  isFieldInvalid(controlName: keyof CompanyUserFormValue): boolean {
    const control = this.form.get(controlName as string);
    return !!control && control.invalid && (control.dirty || control.touched);
  }

  getFieldError(controlName: keyof CompanyUserFormValue): string | null {
    const control = this.form.get(controlName as string);
    if (!control || !(control.dirty || control.touched)) {
      return null;
    }

    if (control.errors?.['required']) {
      return this.requiredFieldMessages[controlName] ?? 'This field is required.';
    }

    if (control.errors?.['email']) {
      return 'Enter a valid email address.';
    }

    return null;
  }

  private buildMetadata(formValue: CompanyUserFormValue): Partial<EnteMetadataPersonaNatural> | null {
    const createdBy = this.authService.currentUser();
    const metadata: Partial<EnteMetadataPersonaNatural> = {
      creadoPor: createdBy?.email ?? 'admin-portal',
      ultimaActualizacion: new Date().toISOString(),
    };

    const birthdate = formValue.birthdate?.trim();
    if (birthdate) {
      metadata.fechaNacimiento = birthdate;
    }

    const genderRaw = formValue.gender?.trim().toUpperCase();
    if (genderRaw === 'M' || genderRaw === 'F') {
      metadata.genero = genderRaw;
    }

    const civilStatus = formValue.civilStatus?.trim();
    if (civilStatus) {
      metadata.estadoCivil = civilStatus;
    }

    const profession = formValue.profession?.trim();
    if (profession) {
      metadata.profesion = profession;
    }

    const nationality = formValue.nationality?.trim();
    if (nationality) {
      metadata.nacionalidad = nationality;
    }

    const children = Number(formValue.children ?? '');
    if (!Number.isNaN(children) && children > 0) {
      metadata.hijos = children;
    }

    const vehicles = Number(formValue.vehicles ?? '');
    if (!Number.isNaN(vehicles) && vehicles > 0) {
      metadata.vehiculos = vehicles;
    }

    return Object.keys(metadata).length > 2 ? metadata : null;
  }

  private executeUserCreation(value: CompanyUserFormValue): void {
    const currentUser = this.authService.currentUser();

    if (currentUser?.isSuperAdmin && !this.companyId) {
      this.toastService.showError(
        'Unable to determine the target company. Please reopen this page from a company context and try again.'
      );
      this.pendingFormValue = null;
      this.confirmationMessage.set(null);
      return;
    }

    const metadata = this.buildMetadata(value);
    const entePayload: CreateEnteRequest = {
      nombre: `${value.firstName?.trim() ?? ''} ${value.lastName?.trim() ?? ''}`.trim(),
      tipo: 'Persona Natural',
      documento: value.documentNumber?.trim() ?? '',
      tipo_documento: value.documentType?.trim() ?? '',
      direccion: value.address?.trim() ?? '',
      telefono: value.phone?.trim() ?? '',
      correo: value.email?.trim() ?? '',
      idregion: Number(value.regionId) || 0,
      activo: true,
      ...(metadata ? { metadatos: metadata } : {}),
      ...(currentUser?.isSuperAdmin ? { companiaCorretajeId: this.companyId } : {}),
    };

    this.pendingFormValue = null;
    this.confirmationMessage.set(null);
    this.isSubmitting.set(true);

    this.enteService
      .createEnte(entePayload)
      .pipe(
        switchMap((enteId) =>
          this.userService.createCompanyUser({
            email: value.email?.trim() ?? '',
            password: value.password?.trim() || undefined,
            companiaCorretajeId: this.companyId,
            rol: value.role as CompanyUserRole,
            enteId,
            oficinaId: value.officeId?.trim() || undefined,
          })
        ),
        takeUntilDestroyed(this.destroyRef),
        catchError((error) => {
          console.error('Failed to create user', error);
          const errorMessage =
            error?.error?.body?.message ||
            'Unable to create the user. Please review the information and try again.';
          this.toastService.showError(errorMessage);
          this.isSubmitting.set(false);
          return of(null);
        })
      )
      .subscribe((user) => {
        this.isSubmitting.set(false);
        if (!user) {
          return;
        }

        this.toastService.showSuccess('User created successfully.');
        this.router.navigate(['/admin/companies', this.companyId, 'users']);
      });
  }
}
