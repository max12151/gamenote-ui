import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environments';
import { IgdbGame } from '../../igdb/models/igdb-game.model';

@Injectable({ providedIn: 'root' })
export class DiscoverService {
  private readonly http = inject(HttpClient);
  private readonly endpoint = `${environment.apiUrl}/api/discover`;

  /**
   * Tirage aléatoire parmi les jeux les plus populaires. Le serveur écarte déjà les jeux
   * notés et ceux passés récemment ; `excludedIds` couvre ce qu'il ne peut pas savoir :
   * les jeux déjà vus pendant cette session mais sur lesquels rien n'a encore été décidé.
   */
  getGames(genre: string | null, limit: number, excludedIds: readonly number[]): Observable<IgdbGame[]> {
    let params = new HttpParams().set('limit', limit);

    if (genre) {
      params = params.set('genre', genre);
    }

    if (excludedIds.length) {
      params = params.set('exclude', excludedIds.join(','));
    }

    return this.http.get<IgdbGame[]>(`${this.endpoint}/games`, { params });
  }

  /** Écarte un jeu des suggestions de cet utilisateur pour la durée définie côté serveur. */
  skipGame(igdbGameId: number): Observable<void> {
    return this.http.post<void>(`${this.endpoint}/skip`, { igdbGameId });
  }
}
