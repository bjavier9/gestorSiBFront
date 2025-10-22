import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isAuthenticated()) {
    router.navigate(['/login']);
    return false;
  }

  const currentUser = authService.currentUser();
  const needsSelection = currentUser?.requiresCompanySelection ?? false;
  const isSelectionRoute = state.url.startsWith('/select-company');

  if (needsSelection && !isSelectionRoute) {
    return router.createUrlTree(['/select-company']);
  }

  if (!needsSelection && isSelectionRoute) {
    return router.createUrlTree(['/dashboard']);
  }

  return true;
};
