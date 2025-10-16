import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AsyncPipe, NgFor, NgIf } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { tap } from 'rxjs/operators';

import { CompanyService } from '@core/services/company.service';

@Component({
  selector: 'app-company-edit-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    NgIf,
    NgFor,
    AsyncPipe,
    RouterLink,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
  ],
  templateUrl: './company-edit-page.component.html',
  styleUrls: ['./company-edit-page.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CompanyEditPageComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly companyService = inject(CompanyService);

  readonly companyId = this.route.snapshot.paramMap.get('companyId') ?? '';
  readonly form = this.formBuilder.group({
    name: ['', Validators.required],
    taxId: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', Validators.required],
    address: [''],
  });

  readonly message = signal('');
  readonly skeletonFields = Array.from({ length: 5 });
  readonly skeletonActions = Array.from({ length: 2 });

  readonly company$ = this.companyService
    .getCompanyById(this.companyId)
    .pipe(tap((company) => {
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
    }));

  submit(): void {
    if (this.form.invalid) {
      this.message.set('Please fill in the required fields.');
      return;
    }

    this.message.set('Company update request sent (mock).');
  }
}
