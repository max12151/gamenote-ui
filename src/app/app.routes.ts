import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'igdb' },
  { path: 'igdb', loadComponent: () => import('./features/igdb/pages/igdb-search-page.component').then(m => m.IgdbSearchPageComponent) },
  { path: '**', redirectTo: 'igdb' }
];
