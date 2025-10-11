import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { CompaniaService } from '../../core/services/compania.service';
import { Compania } from '../../core/models/compania.model';

@Component({
  selector: 'app-company-form',
  templateUrl: './company-form.html',
  styleUrls: ['./company-form.css'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSlideToggleModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CompanyFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  public dialogRef = inject(MatDialogRef<CompanyFormComponent>);
  public data: { company: Compania | null } = inject(MAT_DIALOG_DATA);
  private companiaService = inject(CompaniaService);
  private snackBar = inject(MatSnackBar);

  public companyForm!: FormGroup;
  public isEditMode = false;
  public isSaving = signal(false);

  ngOnInit(): void {
    this.isEditMode = !!this.data.company;

    this.companyForm = this.fb.group({
      nombre: ['', Validators.required],
      rif: ['', Validators.required],
      direccion: ['', Validators.required],
      telefono: ['', Validators.required],
      correo: ['', [Validators.required, Validators.email]],
      activo: [true]
    });

    if (this.isEditMode && this.data.company) {
      this.companyForm.patchValue(this.data.company);
    }
  }

  onSave(): void {
    if (this.companyForm.invalid || this.isSaving()) {
      return;
    }

    this.isSaving.set(true);
    const companyData = this.companyForm.value;

    const saveOperation = this.isEditMode
      ? this.companiaService.update(this.data.company!.id, companyData)
      : this.companiaService.create(companyData);

    saveOperation.subscribe({
      next: (savedCompany) => {
        this.isSaving.set(false);
        const message = this.isEditMode ? 'Compañía actualizada con éxito' : 'Compañía creada con éxito';
        this.snackBar.open(message, 'Cerrar', { duration: 3000 });
        this.dialogRef.close(savedCompany);
      },
      error: (err) => {
        console.error('Error al guardar la compañía:', err);
        this.isSaving.set(false);
        this.snackBar.open('Error al guardar la compañía', 'Cerrar', { duration: 3000 });
      }
    });
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
