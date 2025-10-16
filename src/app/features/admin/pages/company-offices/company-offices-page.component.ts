import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { NgIf } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-company-offices-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    NgIf,
    RouterLink,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
  ],
  templateUrl: './company-offices-page.component.html',
  styleUrls: ['./company-offices-page.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CompanyOfficesPageComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);

  readonly companyId = this.route.snapshot.paramMap.get('companyId') ?? '';
  readonly form = this.formBuilder.group({
    name: ['', Validators.required],
    city: ['', Validators.required],
    phone: ['', Validators.required],
  });

  readonly message = signal('');

  submit(): void {
    if (this.form.invalid) {
      this.message.set('Please fill in every field.');
      return;
    }

    this.message.set('Office creation request sent (mock).');
    this.form.reset();
  }
}
