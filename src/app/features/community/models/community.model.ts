export interface CommunityGame {
  igdbGameId: number;
  title: string;
  coverUrl: string | null;
  releaseDate: number | null;
  averageRating: number;
  ratingCount: number;
  commentCount: number;
}

export interface CommunityRanking {
  games: CommunityGame[];
  totalGames: number;
  page: number;
  size: number;
}

export interface CommunityGameInfo {
  igdbGameId: number;
  title: string;
  coverUrl: string | null;
  releaseDate: number | null;
  summary: string | null;
  genres: string[];
  developers: string[];
  publishers: string[];
  platforms: string[];
}

export interface RatingBucket {
  rating: number;
  count: number;
}

export interface GameComment {
  id: number;
  igdbGameId: number;
  content: string;
  createdAt: string;
  updatedAt: string | null;
  authorId: number;
  authorUsername: string;
  /** Le serveur dit s'il y a une image ; l'octet, lui, vient de la route dediee. */
  authorHasAvatar: boolean;
  /** Note que l'auteur a mise au jeu, affichée à côté de son avis. */
  authorRating: number | null;
  mine: boolean;
  /** Calculé par le serveur : le sien, ou n'importe lequel pour un administrateur. */
  canDelete: boolean;
}

export interface CommunityGameDetail {
  game: CommunityGameInfo;
  averageRating: number;
  ratingCount: number;
  distribution: RatingBucket[];
  comments: GameComment[];
  myRating: number | null;
  myComment: GameComment | null;
}
