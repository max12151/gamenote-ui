import { Routes } from '@angular/router';
import { IgdbSearchPageComponent } from './features/igdb/pages/igdb-search-page.component';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'igdb' },
  { path: 'igdb', loadComponent: () => import('./features/igdb/pages/igdb-search-page.component').then(m => m.IgdbSearchPageComponent) },
  { path: '**', redirectTo: 'igdb' },
  {path: 'igdb-ssearch', component: IgdbSearchPageComponent},
  { path: '', redirectTo: 'igdb-search', pathMatch: 'full' },
];
