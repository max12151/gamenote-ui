import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { IgdbGame } from '../models/igdb-game.model';

@Injectable({ providedIn: 'root' })
export class IgdbApiService {
  private readonly http = inject(HttpClient);
  private readonly endpoint = 'http://localhost:8080/api/igdb/games/search';

  search(title: string, limit = 12): Observable<IgdbGame[]> {
    const params = new HttpParams().set('title', title).set('limit', limit);
    return this.http.get<IgdbGame[]>(this.endpoint, { params });
  }
}
