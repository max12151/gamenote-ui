import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environments';
import { IgdbGame } from '../models/igdb-game.model';

@Injectable({ providedIn: 'root' })
export class IgdbApiService {
  private readonly http = inject(HttpClient);

  // L'URL était codée en dur ici, contrairement à tous les autres services : la recherche
  // aurait continué d'appeler localhost:8080 une fois le site déployé.
  private readonly endpoint = `${environment.apiUrl}/api/igdb/games`;

  search(title: string, limit = 12): Observable<IgdbGame[]> {
    const params = new HttpParams().set('search', title).set('limit', limit);
    return this.http.get<IgdbGame[]>(this.endpoint, { params });
  }
}
