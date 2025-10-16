import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { AsyncPipe, NgClass, NgFor, NgIf } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { map, switchMap } from 'rxjs';

import { CompanyService } from '@core/services/company.service';

@Component({
  selector: 'app-company-overview-page',
  standalone: true,
  imports: [
    NgIf,
    AsyncPipe,
    NgFor,
    RouterLink,
    NgClass,
  ],
  templateUrl: './company-overview-page.component.html',
  styleUrls: ['./company-overview-page.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CompanyOverviewPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly companyService = inject(CompanyService);

  private readonly companyId$ = this.route.paramMap.pipe(
    map((params) => params.get('companyId') ?? '')
  );

  readonly company$ = this.companyId$.pipe(
    switchMap((companyId) => this.companyService.getCompanyById(companyId))
  );
  readonly skeletonRows = Array.from({ length: 3 });
  readonly skeletonActions = Array.from({ length: 3 });
}
