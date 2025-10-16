import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { AsyncPipe, NgFor, NgIf } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
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
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    MatDividerModule,
    MatChipsModule,
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
