import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environments';
import { IgdbGame } from '../../igdb/models/igdb-game.model';

@Injectable({ providedIn: 'root' })
export class DiscoverService {
  private readonly http = inject(HttpClient);
  private readonly endpoint = `${environment.apiUrl}/api/discover/games`;

  getGames(genre: string | null, limit: number, offset: number): Observable<IgdbGame[]> {
    let params = new HttpParams().set('limit', limit).set('offset', offset);
    if (genre) {
      params = params.set('genre', genre);
    }
    return this.http.get<IgdbGame[]>(this.endpoint, { params });
  }
}
