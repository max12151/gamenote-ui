export interface IgdbGame {
  igdbId: number;
  title: string;
  summary: string | null;
  firstReleaseDate: number | null;
  coverUrl: string | null;
  artworkUrls: string[];
  screenshotUrls: string[];
  genres: string[];
  platforms: string[];
  developers: string[];
  publishers: string[];
  rating: number | null;
  aggregatedRating: number | null;
  /** Compteur d'attente IGDB : nombre de joueurs suivant le jeu avant sa sortie. */
  hypes: number | null;
}
