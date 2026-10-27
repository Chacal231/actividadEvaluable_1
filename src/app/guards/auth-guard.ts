import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const allowedRoles = route.data?.['roles'] as string[] | undefined;

  const isLoggedIn = authService.isLoggedIn();
  const role = authService.getCurrentRole();

  if (!isLoggedIn) {
    router.navigate(['/login']);
    return false;
  }

  if (allowedRoles && role && allowedRoles.includes(role)) {
    return true;
  }

  if (allowedRoles && role && !allowedRoles.includes(role)) {
    if (role === 'admin') {
      router.navigate(['/admin-dashboard']);
    } else {
      router.navigate(['/user-dashboard']);
    }
    return false;
  }

  return true;
};

export const adminGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const role = authService.getCurrentRole();

  if (authService.isLoggedIn() && role === 'admin') {
    return true;
  }

  if (authService.isLoggedIn() && role === 'user') {
    router.navigate(['/user-dashboard']);
    return false;
  }

  router.navigate(['/login']);
  return false;
};

export const userOrAdminGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const role = authService.getCurrentRole();

  if (authService.isLoggedIn() && (role === 'user' || role === 'admin')) {
    return true;
  }

  router.navigate(['/login']);
  return false;
};

