import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () => import('./features/home/pages/home/home-page.component').then(m => m.HomePageComponent)
  },
  { path: 'igdb', loadComponent: () => import('./features/igdb/pages/igdb-search/igdb-search-page.component').then(m => m.IgdbSearchPageComponent) },
  { path: 'login', loadComponent: () => import('./features/auth/pages/login/login-page.component').then(m => m.LoginPageComponent) },
  { path: 'register', loadComponent: () => import('./features/auth/pages/register/register-page.component').then(m => m.RegisterPageComponent) },
  {
    path: 'profil',
    canActivate: [authGuard],
    loadComponent: () => import('./features/profile/pages/profile/profile-page.component').then(m => m.ProfilePageComponent)
  },
  {
    // Profil d'un autre joueur, atteint depuis un avis. Route protégée : lire le
    // classement du site ne demande pas de compte, consulter la page de quelqu'un, si.
    path: 'joueurs/:id',
    canActivate: [authGuard],
    loadComponent: () => import('./features/profile/pages/public-profile/public-profile-page.component').then(m => m.PublicProfilePageComponent)
  },
  {
    path: 'collection',
    canActivate: [authGuard],
    loadComponent: () => import('./features/collection/pages/collection/collection-page.component').then(m => m.CollectionPageComponent)
  },
  {
    path: 'decouvrir',
    canActivate: [authGuard],
    loadComponent: () => import('./features/discover/pages/discover/discover-page.component').then(m => m.DiscoverPageComponent)
  },
  {
    path: 'avis',
    canActivate: [authGuard],
    loadComponent: () => import('./features/community/pages/community/community-page.component').then(m => m.CommunityPageComponent)
  },
  {
    path: 'avis/:igdbGameId',
    canActivate: [authGuard],
    loadComponent: () => import('./features/community/pages/community-game/community-game-page.component').then(m => m.CommunityGamePageComponent)
  },
  { path: '**', redirectTo: '' },
];
