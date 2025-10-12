import { Routes } from '@angular/router';
import { authGuard } from '@core/guards/auth.guard';
import { adminGuard } from '@core/guards/admin.guard';
import { AdminLayoutComponent } from '@features/admin/admin-layout/admin-layout.component';
import { HomeRedirectComponent } from '@features/home/home-redirect.component';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('@features/auth/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'dashboard',
    loadComponent: () => import('@features/dashboard/dashboard.component').then(m => m.DashboardComponent),
    canActivate: [authGuard]
  },
  {
    path: 'admin',
    component: AdminLayoutComponent,
    canActivate: [authGuard, adminGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('@features/admin/dashboard/dashboard.component').then(m => m.AdminDashboardComponent)
      },
      {
        path: 'companies',
        loadComponent: () => import('@features/admin/companies/pages/companies/companies.component').then(m => m.CompaniesComponent)
      },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },
  {
    path: '',
    component: HomeRedirectComponent,
    canActivate: [authGuard]
  },
  { path: '**', redirectTo: '', pathMatch: 'full' }
];
