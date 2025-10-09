import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const adminGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const currentUser = authService.currentUser();

  if (currentUser && currentUser.isSuperAdmin) {
    return true;
  } else {
    // Redirigir a la página de dashboard normal si no es superadmin
    return router.createUrlTree(['/dashboard']);
  }
};
