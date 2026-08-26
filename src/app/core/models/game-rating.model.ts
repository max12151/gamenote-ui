export interface GameRating {
  id: number;
  igdbGameId: number;
  title: string;
  coverUrl: string | null;
  releaseDate: number | null;
  genres: string[];
  summary: string | null;
  developers: string[];
  publishers: string[];
  platforms: string[];
  rating: number;
  createdAt: string;
  updatedAt: string | null;
}

export interface RateGameRequest {
  igdbGameId: number;
  title: string;
  coverUrl: string | null;
  releaseDate: number | null;
  genres: string[];
  summary: string | null;
  developers: string[];
  publishers: string[];
  platforms: string[];
  rating: number;
}
