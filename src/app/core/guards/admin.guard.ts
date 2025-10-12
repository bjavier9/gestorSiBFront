import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const adminGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated() && authService.currentUser()?.isSuperAdmin) {
    return true;
  }
  
  // Si el usuario está autenticado pero no es SuperAdmin, redirige al dashboard.
  if (authService.isAuthenticated()) {
    return router.createUrlTree(['/dashboard']);
  }
  
  // Si no está autenticado, auth.guard ya debería haberlo redirigido a /login,
  // pero como fallback, lo hacemos aquí también.
  return router.createUrlTree(['/login']);
};
