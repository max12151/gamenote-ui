import { ChangeDetectionStrategy, Component, HostListener, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { phosphorImageDuotone } from '@ng-icons/phosphor-icons/duotone';
import { finalize } from 'rxjs';
import { GameRating } from '../../../../core/models/game-rating.model';
import { RatingService } from '../../../../core/rating/rating.service';
import { NotePickerComponent } from '../../../../shared/rating/note-picker.component';
import { ratingColor } from '../../../../shared/rating/rating-color';

type SortKey = 'added' | 'rating' | 'releaseDate' | 'title';
type SortDir = 'asc' | 'desc';

@Component({
  selector: 'app-collection-page',
  standalone: true,
  imports: [DatePipe, RouterLink, NotePickerComponent, NgIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './collection-page.component.html',
  styleUrl: './collection-page.component.scss',
  providers: [provideIcons({ phosphorImageDuotone })]
})
export class CollectionPageComponent {
  private readonly ratingService = inject(RatingService);

  protected readonly ratingColor = ratingColor;

  readonly ratings = signal<GameRating[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly removingId = signal<number | null>(null);
  readonly selectedRating = signal<GameRating | null>(null);

  readonly sortKey = signal<SortKey>('added');
  readonly sortDir = signal<SortDir>('desc');
  readonly genreFilter = signal('');

  readonly availableGenres = computed(() => {
    const genres = new Set<string>();
    for (const item of this.ratings()) {
      for (const genre of item.genres ?? []) {
        genres.add(genre);
      }
    }
    return [...genres].sort((a, b) => a.localeCompare(b));
  });

  readonly displayedRatings = computed(() => {
    const genre = this.genreFilter();
    const key = this.sortKey();
    const dir = this.sortDir();

    let list = this.ratings();
    if (genre) {
      list = list.filter(item => item.genres?.includes(genre));
    }

    const sorted = [...list].sort((a, b) => {
      const result = this.compare(a, b, key);
      return dir === 'asc' ? result : -result;
    });

    return sorted;
  });

  constructor() {
    this.ratingService.getCollection().pipe(
      finalize(() => this.loading.set(false))
    ).subscribe({
      next: ratings => this.ratings.set(ratings),
      error: () => this.error.set('Impossible de charger ta collection.')
    });
  }

  setSortKey(key: SortKey): void {
    this.sortKey.set(key);
  }

  toggleSortDir(): void {
    this.sortDir.update(dir => (dir === 'asc' ? 'desc' : 'asc'));
  }

  setGenreFilter(genre: string): void {
    this.genreFilter.set(genre);
  }

  updateRating(gameRating: GameRating, note: number): void {
    this.ratingService.rateGame({
      igdbGameId: gameRating.igdbGameId,
      title: gameRating.title,
      coverUrl: gameRating.coverUrl,
      releaseDate: gameRating.releaseDate,
      genres: gameRating.genres,
      rating: note
    }).subscribe(saved => {
      this.ratings.update(list => list.map(r => (r.igdbGameId === saved.igdbGameId ? saved : r)));
      if (this.selectedRating()?.igdbGameId === saved.igdbGameId) {
        this.selectedRating.set(saved);
      }
    });
  }

  remove(gameRating: GameRating): void {
    this.removingId.set(gameRating.igdbGameId);
    this.ratingService.removeRating(gameRating.igdbGameId).pipe(
      finalize(() => this.removingId.set(null))
    ).subscribe(() => {
      this.ratings.update(list => list.filter(r => r.igdbGameId !== gameRating.igdbGameId));
      if (this.selectedRating()?.igdbGameId === gameRating.igdbGameId) {
        this.closeModal();
      }
    });
  }

  openModal(gameRating: GameRating): void {
    this.selectedRating.set(gameRating);
  }

  closeModal(): void {
    this.selectedRating.set(null);
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.closeModal();
  }

  private compare(a: GameRating, b: GameRating, key: SortKey): number {
    switch (key) {
      case 'rating':
        return a.rating - b.rating;
      case 'releaseDate':
        return (a.releaseDate ?? 0) - (b.releaseDate ?? 0);
      case 'title':
        return a.title.localeCompare(b.title);
      case 'added':
      default:
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    }
  }
}
