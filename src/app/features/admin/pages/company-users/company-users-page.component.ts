import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-company-users-page',
  standalone: true,
  imports: [ReactiveFormsModule, NgIf, RouterLink],
  templateUrl: './company-users-page.component.html',
  styleUrls: ['./company-users-page.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CompanyUsersPageComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);

  readonly companyId = this.route.snapshot.paramMap.get('companyId') ?? '';
  readonly form = this.formBuilder.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    role: ['', Validators.required],
  });

  readonly message = signal('');

  submit(): void {
    if (this.form.invalid) {
      this.message.set('Please fill in every field.');
      return;
    }

    this.message.set('User creation request sent (mock).');
    this.form.reset();
  }
}
