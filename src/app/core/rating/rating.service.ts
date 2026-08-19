import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environments';
import { GameRating, RateGameRequest } from '../models/game-rating.model';
import { RatingStats } from '../models/rating-stats.model';

@Injectable({ providedIn: 'root' })
export class RatingService {
  private readonly http = inject(HttpClient);
  private readonly endpoint = `${environment.apiUrl}/api/ratings`;

  rateGame(request: RateGameRequest): Observable<GameRating> {
    return this.http.post<GameRating>(this.endpoint, request);
  }

  getCollection(): Observable<GameRating[]> {
    return this.http.get<GameRating[]>(this.endpoint);
  }

  getStats(): Observable<RatingStats> {
    return this.http.get<RatingStats>(`${this.endpoint}/stats`);
  }

  removeRating(igdbGameId: number): Observable<void> {
    return this.http.delete<void>(`${this.endpoint}/${igdbGameId}`);
  }
}
