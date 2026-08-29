import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { DatePipe } from '@angular/common';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { phosphorImageDuotone } from '@ng-icons/phosphor-icons/duotone';
import { finalize } from 'rxjs';
import { DiscoverService } from '../../data-access/discover.service';
import { IGDB_GENRES } from '../../models/genres';
import { IgdbGame } from '../../../igdb/models/igdb-game.model';
import { RatingService } from '../../../../core/rating/rating.service';
import { NotePickerComponent } from '../../../../shared/rating/note-picker.component';

const BATCH_SIZE = 10;
const PREFETCH_THRESHOLD = 2;

@Component({
  selector: 'app-discover-page',
  standalone: true,
  imports: [DatePipe, NotePickerComponent, NgIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './discover-page.component.html',
  styleUrl: './discover-page.component.scss',
  providers: [provideIcons({ phosphorImageDuotone })]
})
export class DiscoverPageComponent {
  private readonly discoverService = inject(DiscoverService);
  private readonly ratingService = inject(RatingService);

  readonly genres = IGDB_GENRES;
  readonly selectedGenre = signal('');
  readonly queue = signal<IgdbGame[]>([]);
  readonly current = computed(() => this.queue()[0] ?? null);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly exhausted = signal(false);
  readonly saving = signal(false);
  readonly justRated = signal<number | null>(null);

  /**
   * Jeux déjà proposés depuis le chargement de la page. Le serveur tire au hasard dans un
   * vivier de jeux populaires : sans cette mémoire de session, un jeu vu il y a trois lots
   * mais ni noté ni passé pourrait ressortir. La liste est bornée par la taille du vivier.
   */
  private readonly seenIds = new Set<number>();

  constructor() {
    this.loadBatch(true);
  }

  onGenreChange(genre: string): void {
    this.selectedGenre.set(genre);
    this.exhausted.set(false);
    this.error.set('');
    this.queue.set([]);
    this.seenIds.clear();
    this.loadBatch(true);
  }

  rate(note: number): void {
    const game = this.current();
    if (!game || this.saving()) {
      return;
    }

    this.saving.set(true);

    this.ratingService.rateGame({
      igdbGameId: game.igdbId,
      title: game.title,
      coverUrl: game.coverUrl,
      releaseDate: game.firstReleaseDate,
      genres: game.genres,
      summary: game.summary,
      developers: game.developers,
      publishers: game.publishers,
      platforms: game.platforms,
      rating: note
    }).pipe(
      finalize(() => this.saving.set(false))
    ).subscribe({
      next: () => {
        this.justRated.set(note);
        setTimeout(() => this.justRated.set(null), 700);
        this.advance();
      },
      error: () => this.error.set("Impossible d'enregistrer la note.")
    });
  }

  skip(): void {
    const game = this.current();
    if (!game || this.saving()) {
      return;
    }

    // On passe au jeu suivant sans attendre la réponse : l'enregistrement du délai de
    // réapparition ne doit pas se payer d'un temps d'attente à chaque "Passer". Le jeu
    // reste de toute façon écarté de cette session par seenIds si l'appel échoue.
    this.advance();

    this.discoverService.skipGame(game.igdbId).subscribe({
      error: () => this.error.set("Ce jeu n'a pas pu être mis de côté, il pourra réapparaître.")
    });
  }

  private advance(): void {
    this.queue.update(list => list.slice(1));

    if (this.queue().length <= PREFETCH_THRESHOLD && !this.exhausted()) {
      this.loadBatch(false);
    }
  }

  private loadBatch(showLoading: boolean): void {
    if (this.exhausted()) {
      return;
    }

    if (showLoading) {
      this.loading.set(true);
    }

    this.discoverService.getGames(this.selectedGenre() || null, BATCH_SIZE, [...this.seenIds]).pipe(
      finalize(() => this.loading.set(false))
    ).subscribe({
      next: games => {
        if (games.length === 0) {
          this.exhausted.set(true);
          return;
        }

        for (const game of games) {
          this.seenIds.add(game.igdbId);
        }

        this.queue.update(list => [...list, ...games]);
      },
      error: (err: HttpErrorResponse) => this.error.set(err.error?.message ?? 'Impossible de charger des suggestions.')
    });
  }
}
