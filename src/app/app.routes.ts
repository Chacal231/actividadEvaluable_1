import { Routes } from '@angular/router';
import { adminGuard, userOrAdminGuard } from './guards/auth-guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./login/login.page').then((m) => m.LoginPage),
  },
  {
    path: 'register',
    loadComponent: () => import('./register/register.page').then((m) => m.RegisterPage),
  },
  {
    path: 'admin-dashboard',
    loadComponent: () =>
      import('./admin-dashboard/admin-dashboard.page').then(
        (m) => m.AdminDashboardPage
      ),
    canActivate: [adminGuard],
  },
  {
    path: 'user-dashboard',
    loadComponent: () =>
      import('./user-dashboard/user-dashboard.page').then(
        (m) => m.UserDashboardPage
      ),
    canActivate: [userOrAdminGuard],
  },
  {
    path: 'home',
    loadComponent: () => import('./home/home.page').then((m) => m.HomePage),
  },
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
  {
    path: '**',
    redirectTo: 'login',
  },
];

