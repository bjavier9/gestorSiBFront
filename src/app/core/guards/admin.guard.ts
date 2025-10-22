import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthService } from '../services/auth.service';

export const adminGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const isAuthenticated = authService.isAuthenticated();
  const currentUser = authService.currentUser();

  if (!isAuthenticated) {
    return router.createUrlTree(['/login']);
  }

  if (currentUser?.requiresCompanySelection) {
    return router.createUrlTree(['/select-company']);
  }

  if (currentUser?.isSuperAdmin) {
    return true;
  }

  return router.createUrlTree(['/dashboard']);
};
