import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environments';
import { CommunityGameDetail, CommunityRanking, GameComment } from '../models/community.model';

@Injectable({ providedIn: 'root' })
export class CommunityService {
  private readonly http = inject(HttpClient);
  private readonly communityEndpoint = `${environment.apiUrl}/api/community`;
  private readonly commentsEndpoint = `${environment.apiUrl}/api/comments`;

  getRanking(page: number, size: number): Observable<CommunityRanking> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http.get<CommunityRanking>(`${this.communityEndpoint}/games`, { params });
  }

  getGameDetail(igdbGameId: number): Observable<CommunityGameDetail> {
    return this.http.get<CommunityGameDetail>(`${this.communityEndpoint}/games/${igdbGameId}`);
  }

  /** Crée l'avis de l'utilisateur sur ce jeu, ou remplace le sien s'il en avait déjà un. */
  saveComment(igdbGameId: number, content: string): Observable<GameComment> {
    return this.http.post<GameComment>(`${this.commentsEndpoint}/games/${igdbGameId}`, { content });
  }

  deleteComment(commentId: number): Observable<void> {
    return this.http.delete<void>(`${this.commentsEndpoint}/${commentId}`);
  }
}
