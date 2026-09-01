import { GameRating } from '../../../core/models/game-rating.model';
import { GenreCount } from '../../../core/models/rating-stats.model';
import { UserRole } from '../../../core/models/user.model';
import { RecentComment } from '../../community/models/community.model';

/**
 * Profil d'un joueur vu par un autre membre.
 *
 * Type distinct de `User`, et non un `User` dont on éviterait d'afficher l'adresse : le
 * serveur ne l'envoie pas, et ce modèle n'a donc aucun champ où elle pourrait se glisser.
 * L'avatar suit la même logique — un booléen, l'image venant de la route dédiée.
 */
export interface PublicProfile {
  id: number;
  username: string;
  bio: string | null;
  hasAvatar: boolean;
  role: UserRole;
  createdAt: string;
  ratedGames: number;
  averageRating: number | null;
  topGenre: string | null;
  topGenreCount: number;
  bestRatedGame: GameRating | null;
  genreBreakdown: GenreCount[];
  recentComments: RecentComment[];
}
