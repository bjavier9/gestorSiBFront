import { AsyncPipe, NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators, ValidatorFn } from '@angular/forms';
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
import {
  CreateEnteRequest,
  EnteMetadataPersonaNatural,
  Ente,
  EnteGenero,
  EnteEstadoCivil,
} from '@core/models/ente.model';
import { Office } from '@core/models/office.model';
import { CompanyUserRole } from '@core/models/company-user.model';
import { RoleOption } from '@core/models/role.model';
import { BreadcrumbsComponent } from '@features/shared/components/breadcrumbs/breadcrumbs.component';
import { ConfirmDialogComponent } from '@features/shared/components/confirm-dialog/confirm-dialog.component';

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
  gender: EnteGenero | null;
  civilStatus: EnteEstadoCivil | '' | null;
  profession: string | null;
  nationality: string | null;
  children: string | null;
  vehicles: string | null;
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
    gender: [EnteGenero.Masculino],
    civilStatus: [''],
    profession: [''],
    nationality: [''],
    children: [''],
    vehicles: [''],
    password: [''],
    officeId: [''],
  });

  readonly existingEnteSearchControl = this.formBuilder.control('', [Validators.required, Validators.email]);
  readonly useExistingEnte = signal(false);
  readonly isSearchingEnte = signal(false);
  readonly enteSearchResults = signal<Ente[]>([]);
  readonly enteSearchError = signal<string | null>(null);
  readonly selectedExistingEnte = signal<Ente | null>(null);
  readonly isSubmitting = signal(false);
  readonly isConfirmationOpen = signal(false);
  readonly confirmationMessage = signal<string | null>(null);
  readonly skeletonFields = Array.from({ length: 8 });
  readonly genderOptions = Object.values(EnteGenero) as EnteGenero[];
  readonly civilStatusOptions = Object.values(EnteEstadoCivil) as EnteEstadoCivil[];
  private readonly enteFieldControlNames: (keyof CompanyUserFormValue)[] = [
    'firstName',
    'lastName',
    'documentType',
    'documentNumber',
    'phone',
    'address',
    'regionId',
    'birthdate',
    'gender',
    'civilStatus',
    'profession',
    'nationality',
    'children',
    'vehicles',
  ];
  private readonly defaultControlValidators: Partial<Record<keyof CompanyUserFormValue, ValidatorFn[]>> = {
    firstName: [Validators.required],
    lastName: [Validators.required],
    email: [Validators.required, Validators.email],
    role: [Validators.required],
    documentType: [Validators.required],
    documentNumber: [Validators.required],
    phone: [Validators.required],
    address: [Validators.required],
  };
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
  private pendingExistingEnte: Ente | null = null;

  submit(): void {
    const useExisting = this.useExistingEnte();
    const selectedEnte = this.selectedExistingEnte();

    if (useExisting && !selectedEnte) {
      this.toastService.showError('Select an existing ente before creating the user.');
      return;
    }

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

    if (useExisting) {
      const fallbackEmail = selectedEnte?.correo?.trim() ?? '';
      const emailFromForm = value.email?.trim() ?? '';
      if (!emailFromForm && fallbackEmail) {
        value.email = fallbackEmail;
      }

      if (!value.email?.trim()) {
        this.toastService.showError('The selected ente does not have a valid email configured.');
        return;
      }
    }

    this.pendingExistingEnte = useExisting ? selectedEnte : null;
    this.pendingFormValue = value;

    const emailForConfirmation = value.email?.trim() ?? '';
    const confirmationText = this.pendingExistingEnte
      ? `Are you sure you want to create the user ${emailForConfirmation} using the existing ente ${this.pendingExistingEnte.nombre}?`
      : `Are you sure you want to create the user ${emailForConfirmation}?`;

    this.confirmationMessage.set(confirmationText);
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
    this.executeUserCreation(value, this.pendingExistingEnte);
  }

  cancelPendingCreation(): void {
    if (!this.pendingFormValue) {
      this.isConfirmationOpen.set(false);
      return;
    }

    this.pendingFormValue = null;
    this.pendingExistingEnte = null;
    this.isConfirmationOpen.set(false);
    this.confirmationMessage.set(null);
  }

  toggleUseExistingEnte(useExisting: boolean): void {
    if (this.useExistingEnte() === useExisting) {
      return;
    }

    this.useExistingEnte.set(useExisting);

    if (useExisting) {
      this.setEnteControlsEnabled(false);
      this.updateEmailControlState(false);
      this.resetExistingEnteState(true);
      this.resetEnteFormValues();
      this.form.patchValue({ email: '' }, { emitEvent: false });
    } else {
      this.setEnteControlsEnabled(true);
      this.updateEmailControlState(true);
      this.resetExistingEnteState(true);
      this.resetEnteFormValues({ gender: EnteGenero.Masculino });
      this.form.patchValue({ email: '' }, { emitEvent: false });
    }
  }

  searchExistingEnte(): void {
    if (!this.useExistingEnte()) {
      return;
    }

    this.existingEnteSearchControl.markAsTouched();
    if (this.existingEnteSearchControl.invalid) {
      return;
    }

    const email = this.existingEnteSearchControl.value?.trim() ?? '';
    if (!email) {
      return;
    }

    this.isSearchingEnte.set(true);
    this.enteSearchError.set(null);
    this.enteSearchResults.set([]);

    const companiaId = this.companyId?.trim() || undefined;

    this.enteService
      .searchEntesByEmail(email, companiaId)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError((error) => {
          console.error('Failed to search entes', error);
          const message =
            error?.error?.body?.error?.message ||
            'Unable to search for entes. Please try again.';
          this.enteSearchResults.set([]);
          this.selectedExistingEnte.set(null);
          this.enteSearchError.set(message);
          this.isSearchingEnte.set(false);
          return of([]);
        })
      )
      .subscribe((results) => {
        this.isSearchingEnte.set(false);
        this.enteSearchResults.set(results);
        if (results.length === 1) {
          this.selectExistingEnte(results[0]);
        } else if (results.length === 0) {
          this.selectedExistingEnte.set(null);
        }
      });
  }

  selectExistingEnte(ente: Ente): void {
    this.selectedExistingEnte.set(ente);
    this.enteSearchError.set(null);
    this.form.patchValue({ email: ente.correo ?? '' }, { emitEvent: false });
    this.applyExistingEnteToForm(ente);
  }

  resetExistingEnteSearch(): void {
    this.resetExistingEnteState(true);
    this.form.patchValue({ email: '' }, { emitEvent: false });
    this.resetEnteFormValues();
  }

  clearExistingEnteSelection(): void {
    this.selectedExistingEnte.set(null);
    this.form.patchValue({ email: '' }, { emitEvent: false });
    this.resetEnteFormValues();
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

    const gender = this.normalizeGenero(formValue.gender);
    if (gender) {
      metadata.genero = gender;
    }

    const civilStatus = this.normalizeEstadoCivil(formValue.civilStatus);
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

  private executeUserCreation(value: CompanyUserFormValue, existingEnte: Ente | null): void {
    const currentUser = this.authService.currentUser();

    if (currentUser?.isSuperAdmin && !this.companyId) {
      this.toastService.showError(
        'Unable to determine the target company. Please reopen this page from a company context and try again.'
      );
      this.pendingFormValue = null;
      this.pendingExistingEnte = null;
      this.confirmationMessage.set(null);
      return;
    }

    const email = value.email?.trim() || existingEnte?.correo?.trim() || '';
    if (!email) {
      this.toastService.showError('A valid email address is required to create the user.');
      this.pendingFormValue = null;
      this.pendingExistingEnte = null;
      this.confirmationMessage.set(null);
      return;
    }

    let enteId$: ReturnType<typeof this.enteService.createEnte>;
    if (existingEnte) {
      enteId$ = of(existingEnte.id);
    } else {
      const metadata = this.buildMetadata(value);
      const entePayload: CreateEnteRequest = {
        nombre: `${value.firstName?.trim() ?? ''} ${value.lastName?.trim() ?? ''}`.trim(),
        tipo: 'Persona Natural',
        documento: value.documentNumber?.trim() ?? '',
        tipo_documento: value.documentType?.trim() ?? '',
        direccion: value.address?.trim() ?? '',
        telefono: value.phone?.trim() ?? '',
        correo: email,
        idregion: Number(value.regionId) || 0,
        activo: true,
        ...(metadata ? { metadatos: metadata } : {}),
        ...(currentUser?.isSuperAdmin ? { companiaCorretajeId: this.companyId } : {}),
      };
      enteId$ = this.enteService.createEnte(entePayload);
    }

    this.pendingFormValue = null;
    this.pendingExistingEnte = null;
    this.confirmationMessage.set(null);
    this.isSubmitting.set(true);

    enteId$
      .pipe(
        switchMap((enteId) =>
          this.userService.createCompanyUser({
            email,
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

  private setEnteControlsEnabled(enabled: boolean): void {
    for (const controlName of this.enteFieldControlNames) {
      const control = this.form.get(controlName as string);
      if (!control) {
        continue;
      }

      const validators = enabled ? this.defaultControlValidators[controlName] ?? [] : [];
      control.setValidators(validators);

      if (enabled) {
        control.enable({ emitEvent: false });
      } else {
        control.disable({ emitEvent: false });
        const clearedValue =
          controlName === 'gender' ? EnteGenero.Masculino : '';
        control.setValue(clearedValue, { emitEvent: false });
      }

      control.updateValueAndValidity({ emitEvent: false });
      control.markAsPristine();
      control.markAsUntouched();
    }
  }

  private updateEmailControlState(enabled: boolean): void {
    const control = this.form.get('email');
    if (!control) {
      return;
    }

    const validators = this.defaultControlValidators.email ?? [];
    control.setValidators(validators);

    if (enabled) {
      control.enable({ emitEvent: false });
    } else {
      control.disable({ emitEvent: false });
    }

    control.updateValueAndValidity({ emitEvent: false });
    control.markAsPristine();
    control.markAsUntouched();
  }

  private resetExistingEnteState(clearSearch: boolean): void {
    this.selectedExistingEnte.set(null);
    this.enteSearchResults.set([]);
    this.enteSearchError.set(null);
    if (clearSearch) {
      this.existingEnteSearchControl.reset('', { emitEvent: false });
    }
  }

  private resetEnteFormValues(overrides: Partial<CompanyUserFormValue> = {}): void {
    const defaults: Partial<CompanyUserFormValue> = {
      firstName: '',
      lastName: '',
      documentType: '',
      documentNumber: '',
      phone: '',
      address: '',
      regionId: '',
      birthdate: '',
      gender: EnteGenero.Masculino,
      civilStatus: '',
      profession: '',
      nationality: '',
      children: '',
      vehicles: '',
    };

    this.form.patchValue({ ...defaults, ...overrides }, { emitEvent: false });
  }

  private applyExistingEnteToForm(ente: Ente): void {
    const nameParts = ente.nombre?.trim().split(/\s+/).filter((segment) => !!segment) ?? [];
    const firstName = nameParts.shift() ?? '';
    const lastName = nameParts.join(' ');

    const rawMetadata = (ente.metadatos ?? {}) as Partial<EnteMetadataPersonaNatural>;
    const genderValue = this.normalizeGenero(rawMetadata?.genero) || EnteGenero.Masculino;
    const civilStatusValue = this.normalizeEstadoCivil(rawMetadata?.estadoCivil);

    this.form.patchValue(
      {
        firstName,
        lastName,
        documentType: ente.tipo_documento ?? '',
        documentNumber: ente.documento ?? '',
        phone: ente.telefono ?? '',
        address: ente.direccion ?? '',
        regionId: ente.idregion ? String(ente.idregion) : '',
        birthdate: this.formatDateInput(rawMetadata?.fechaNacimiento as string | Date | undefined),
        gender: genderValue,
        civilStatus: civilStatusValue,
        profession: rawMetadata?.profesion ?? '',
        nationality: rawMetadata?.nacionalidad ?? '',
        children: rawMetadata?.hijos != null ? String(rawMetadata.hijos) : '',
        vehicles: rawMetadata?.vehiculos != null ? String(rawMetadata.vehiculos) : '',
      },
      { emitEvent: false }
    );
  }

  private formatDateInput(value: string | Date | undefined): string {
    if (!value) {
      return '';
    }

    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) {
      return '';
    }

    return date.toISOString().slice(0, 10);
  }

  private normalizeGenero(value: unknown): EnteGenero | '' {
    return this.normalizeEnumValue(
      value,
      this.genderOptions,
      {
        M: EnteGenero.Masculino,
        Masculino: EnteGenero.Masculino,
        F: EnteGenero.Femenino,
        Femenino: EnteGenero.Femenino,
        'No binario': EnteGenero.NoBinario,
        'Prefiero no decir': EnteGenero.PrefieroNoDecir,
      },
    );
  }

  private normalizeEstadoCivil(value: unknown): EnteEstadoCivil | '' {
    return this.normalizeEnumValue(
      value,
      this.civilStatusOptions,
      {
        Soltero: EnteEstadoCivil.Soltero,
        'Soltero/a': EnteEstadoCivil.Soltero,
        Casado: EnteEstadoCivil.Casado,
        'Casado/a': EnteEstadoCivil.Casado,
        Divorciado: EnteEstadoCivil.Divorciado,
        'Divorciado/a': EnteEstadoCivil.Divorciado,
        Viudo: EnteEstadoCivil.Viudo,
        'Viudo/a': EnteEstadoCivil.Viudo,
        'Union libre': EnteEstadoCivil.UnionLibre,
      },
    );
  }

  private normalizeEnumValue<T extends string>(
    value: unknown,
    options: readonly T[],
    aliases: Record<string, T> = {},
  ): T | '' {
    if (typeof value !== 'string') {
      return '';
    }

    const normalizedCandidate = this.normalizeString(value);
    const normalizedAliases = Object.entries(aliases).reduce<Record<string, T>>(
      (accumulator, [key, enumValue]) => {
        accumulator[this.normalizeString(key)] = enumValue;
        return accumulator;
      },
      {},
    );

    const aliasMatch = normalizedAliases[normalizedCandidate];
    if (aliasMatch) {
      return aliasMatch;
    }

    const match = options.find(
      (option) => this.normalizeString(option) === normalizedCandidate,
    );

    return match ?? '';
  }

  private normalizeString(value: string): string {
    return value
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }
}
