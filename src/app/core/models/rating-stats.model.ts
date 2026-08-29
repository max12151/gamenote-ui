import { GameRating } from './game-rating.model';

export interface GenreCount {
  genre: string;
  count: number;
}

export interface RatingBucket {
  rating: number;
  count: number;
}

/** Situe l'utilisateur par rapport au reste du site sur les jeux notes par plusieurs joueurs. */
export interface TasteComparison {
  /** Negatif : plus severe que la moyenne. Positif : plus genereux. */
  averageDelta: number;
  comparedGames: number;
  stricter: number;
  aligned: number;
  generous: number;
}

export interface RatingStats {
  totalRated: number;
  averageRating: number | null;
  topGenre: string | null;
  topGenreCount: number;
  bestRatedGame: GameRating | null;
  genreBreakdown: GenreCount[];
  ratingDistribution: RatingBucket[];
  tasteComparison: TasteComparison;
}
