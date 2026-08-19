import { GameRating } from './game-rating.model';

export interface GenreCount {
  genre: string;
  count: number;
}

export interface RatingStats {
  totalRated: number;
  averageRating: number | null;
  topGenre: string | null;
  topGenreCount: number;
  bestRatedGame: GameRating | null;
  genreBreakdown: GenreCount[];
}
