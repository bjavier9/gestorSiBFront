import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { AsyncPipe, NgFor, NgIf } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';

import { CompanyService } from '@core/services/company.service';
import { Company } from '@core/models/company.model';

@Component({
  selector: 'app-company-list-page',
  standalone: true,
  imports: [
    NgIf,
    NgFor,
    AsyncPipe,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    MatDividerModule,
    MatChipsModule,
  ],
  templateUrl: './company-list-page.component.html',
  styleUrls: ['./company-list-page.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CompanyListPageComponent {
  private readonly companyService = inject(CompanyService);

  readonly companies$ = this.companyService.getCompanies();
  readonly skeletonItems = Array.from({ length: 3 });

  trackById(_: number, company: Company): string {
    return company.id;
  }
}
