import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { Authservice } from './authservice';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(Authservice);
  const router = inject(Router);

  if (authService.isLoggedIn()) {
    return true;
  } else {
    // Redirect to login page with return url
    router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
    return false;
  }
};