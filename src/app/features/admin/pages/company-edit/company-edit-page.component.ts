import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AsyncPipe, NgIf } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { tap } from 'rxjs/operators';

import { CompanyService } from '@core/services/company.service';

@Component({
  selector: 'app-company-edit-page',
  standalone: true,
  imports: [ReactiveFormsModule, NgIf, AsyncPipe, RouterLink],
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
