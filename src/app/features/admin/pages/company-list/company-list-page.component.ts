import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { AsyncPipe, NgClass, NgFor, NgIf } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CompanyService } from '@core/services/company.service';
import { Company } from '@core/models/company.model';
import {
  BreadcrumbsComponent,
  BreadcrumbItem,
} from '@features/admin/components/breadcrumbs/breadcrumbs.component';

@Component({
  selector: 'app-company-list-page',
  standalone: true,
  imports: [
    NgIf,
    NgFor,
    AsyncPipe,
    RouterLink,
    NgClass,
    BreadcrumbsComponent,
  ],
  templateUrl: './company-list-page.component.html',
  styleUrls: ['./company-list-page.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CompanyListPageComponent {
  private readonly companyService = inject(CompanyService);

  readonly companies$ = this.companyService.getCompanies();
  readonly skeletonItems = Array.from({ length: 3 });
  readonly breadcrumbs: BreadcrumbItem[] = [{ label: 'Companies' }];

  trackById(_: number, company: Company): string {
    return company.id;
  }
}
