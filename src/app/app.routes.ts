import { Routes } from '@angular/router';

import { authGuard } from '@core/guards/auth.guard';
import { adminGuard } from '@core/guards/admin.guard';
import { AdminShellComponent } from '@features/admin/layout/admin-shell.component';
import { CompanyListPageComponent } from '@features/admin/pages/company-list/company-list-page.component';
import { CompanyOverviewPageComponent } from '@features/admin/pages/company-overview/company-overview-page.component';
import { CompanyUsersPageComponent } from '@features/admin/pages/company-users/company-users-page.component';
import { CompanyOfficesPageComponent } from '@features/admin/pages/company-offices/company-offices-page.component';
import { CompanyEditPageComponent } from '@features/admin/pages/company-edit/company-edit-page.component';
import { HomeRedirectComponent } from '@features/home/home-redirect.component';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('@features/auth/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'dashboard',
    loadComponent: () => import('@features/dashboard/dashboard.component').then((m) => m.DashboardComponent),
    canActivate: [authGuard],
  },
  {
    path: 'admin',
    component: AdminShellComponent,
    canActivate: [authGuard, adminGuard],
    children: [
      { path: '', redirectTo: 'companies', pathMatch: 'full' },
      { path: 'companies', component: CompanyListPageComponent },
      { path: 'companies/:companyId', component: CompanyOverviewPageComponent },
      { path: 'companies/:companyId/users', component: CompanyUsersPageComponent },
      { path: 'companies/:companyId/offices', component: CompanyOfficesPageComponent },
      { path: 'companies/:companyId/edit', component: CompanyEditPageComponent },
    ],
  },
  {
    path: '',
    component: HomeRedirectComponent,
    canActivate: [authGuard],
  },
  { path: '**', redirectTo: '', pathMatch: 'full' },
];
