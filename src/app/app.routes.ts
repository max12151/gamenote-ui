import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'igdb' },
  { path: 'igdb', loadComponent: () => import('./features/igdb/pages/igdb-search/igdb-search-page.component').then(m => m.IgdbSearchPageComponent) },
  { path: 'login', loadComponent: () => import('./features/auth/pages/login/login-page.component').then(m => m.LoginPageComponent) },
  { path: 'register', loadComponent: () => import('./features/auth/pages/register/register-page.component').then(m => m.RegisterPageComponent) },
  {
    path: 'profil',
    canActivate: [authGuard],
    loadComponent: () => import('./features/profile/pages/profile/profile-page.component').then(m => m.ProfilePageComponent)
  },
  { path: '**', redirectTo: 'igdb' },
];
