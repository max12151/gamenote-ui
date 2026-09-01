import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environments';
import { RecentComment } from '../../community/models/community.model';
import { IgdbGame } from '../../igdb/models/igdb-game.model';

@Injectable({ providedIn: 'root' })
export class HomeService {
  private readonly http = inject(HttpClient);

  /**
   * Jeux pas encore sortis, du plus attendu au moins attendu. Le classement vient du
   * compteur d'attente d'IGDB, et non d'une note : ces jeux n'en ont pas encore.
   */
  getUpcoming(limit = 8): Observable<IgdbGame[]> {
    const params = new HttpParams().set('limit', limit);
    return this.http.get<IgdbGame[]>(`${environment.apiUrl}/api/igdb/upcoming`, { params });
  }

  /**
   * Derniers avis publiés sur le site, tous jeux confondus.
   *
   * Route réservée aux membres, contrairement au classement : une moyenne ne désigne
   * personne, un avis porte le pseudo et les mots de quelqu'un.
   */
  getRecentComments(limit = 6): Observable<RecentComment[]> {
    const params = new HttpParams().set('limit', limit);
    return this.http.get<RecentComment[]>(`${environment.apiUrl}/api/community/comments/recent`, { params });
  }
}
