import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthApiService } from '../api/auth-api.service';

export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthApiService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    return true;
  }

  return router.createUrlTree(['/login']);
};

export const adminGuard: CanActivateFn = () => {
  const authService = inject(AuthApiService);
  const router = inject(Router);

  if (authService.isAdmin()) {
    return true;
  }

  return router.createUrlTree(['/login']);
};
