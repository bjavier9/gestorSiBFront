import { ChangeDetectionStrategy, Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { debounceTime, distinctUntilChanged, filter } from 'rxjs/operators';

import { CompaniaService } from '@core/services/compania.service';
import { Compania } from '@core/models/compania.model';
import { CompanyFormComponent } from '@features/admin/companies/components/company-form/company-form.component';
import { ConfirmationDialogComponent } from '@shared/components/confirmation-dialog/confirmation-dialog.component';
import { companiesTexts } from '@core/constants/companies.constants';

@Component({
  selector: 'app-companies',
  templateUrl: './companies.component.html',
  styleUrls: ['./companies.component.css'],
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule,
    MatSnackBarModule
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CompaniesComponent implements OnInit {
  private companiaService = inject(CompaniaService);
  public dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  private allCompanies = signal<Compania[]>([]);
  public searchTerm = signal<string>('');
  public searchControl = new FormControl('');
  public texts = companiesTexts;

  public filteredCompanies = computed(() => {
    const term = this.searchTerm().toLowerCase();
    if (!term) {
      return this.allCompanies();
    }
    return this.allCompanies().filter(company =>
      company.nombre.toLowerCase().includes(term) ||
      company.rif.toLowerCase().includes(term)
    );
  });

  ngOnInit(): void {
    this.loadCompanies();
    this.searchControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(value => {
      this.searchTerm.set(value || '');
    });
  }

  loadCompanies(): void {
    this.companiaService.getCompanias().subscribe({
      next: (data) => this.allCompanies.set(data),
      error: (err) => console.error('Error al cargar las compañías:', err),
    });
  }

  openForm(company: Compania | null = null): void {
    const dialogRef = this.dialog.open(CompanyFormComponent, {
      width: '500px',
      maxWidth: '95vw',
      disableClose: true,
      data: { company, title: company ? this.texts.editCompany : this.texts.newCompany }
    });

    dialogRef.afterClosed().pipe(filter(result => !!result)).subscribe((result: Compania) => {
      if (company) {
        this.allCompanies.update(companies =>
          companies.map(c => c.id === result.id ? result : c)
        );
        this.snackBar.open(this.texts.successfullyUpdated, this.texts.cancel, { duration: 3000 });
      } else {
        this.allCompanies.update(companies => [...companies, result]);
        this.snackBar.open(this.texts.successfullyCreated, this.texts.cancel, { duration: 3000 });
      }
    });
  }

  toggleStatus(company: Compania): void {
    const action = company.activo ? this.texts.delete : this.texts.restore;
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      data: {
        title: `Confirmar ${action}`,
        message: `¿Estás seguro de que deseas ${action.toLowerCase()} la compañía "${company.nombre}"?`
      }
    });

    dialogRef.afterClosed().pipe(filter(result => result)).subscribe(() => {
      const newStatus = !company.activo;
      this.companiaService.changeStatus(company.id, newStatus).subscribe({
        next: () => {
          this.allCompanies.update(companies =>
            companies.map(c =>
              c.id === company.id ? { ...c, activo: newStatus } : c
            )
          );
          const message = `Compañía ${company.nombre} ${newStatus ? this.texts.successfullyRestored : this.texts.successfullyDeleted}`;
          this.snackBar.open(message, this.texts.cancel, { duration: 3000 });
        },
        error: (err) => {
            console.error(`Error al cambiar el estado de la compañía ${company.id}:`, err);
            this.snackBar.open('Error al cambiar el estado', this.texts.cancel, { duration: 3000 });
        }
      });
    });
  }
}
