import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  effect,
  inject,
  signal,
  viewChild
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { phosphorImageDuotone, phosphorXDuotone } from '@ng-icons/phosphor-icons/duotone';
import { phosphorXBold } from '@ng-icons/phosphor-icons/bold';
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
  providers: [provideIcons({ phosphorImageDuotone, phosphorXDuotone, phosphorXBold })]
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

  private readonly detailDialog = viewChild<ElementRef<HTMLDialogElement>>('detailDialog');

  constructor() {
    this.ratingService.getCollection().pipe(
      finalize(() => this.loading.set(false))
    ).subscribe({
      next: ratings => this.ratings.set(ratings),
      error: () => this.error.set('Impossible de charger ta collection.')
    });

    // Le <dialog> natif est piloté par des méthodes impératives : on se contente de le
    // synchroniser sur le signal, qui reste la source de vérité pour le template.
    effect(onCleanup => {
      const dialog = this.detailDialog()?.nativeElement;

      if (!dialog) {
        return;
      }

      const open = this.selectedRating() !== null;

      if (open && !dialog.open) {
        // showModal() donne le focus au dialog, ce qui pousse le navigateur à faire
        // défiler le document jusqu'à lui. Deux conséquences si on laisse faire : ouvrir
        // une fiche depuis le bas d'une longue collection ramène en haut de liste, et
        // la modal s'affiche décalée du nombre de pixels que le défilement vient de
        // perdre — tronquée en haut de l'écran. On restaure donc la position aussitôt.
        const scrollY = window.scrollY;
        dialog.showModal();
        window.scrollTo({ top: scrollY, behavior: 'instant' });
      } else if (!open && dialog.open) {
        dialog.close();
      }

      // showModal() rend le reste de la page inerte mais ne bloque pas son défilement :
      // sans ce verrou, la molette continue de faire défiler la collection derrière.
      // Le nettoyage couvre aussi la destruction du composant modal encore ouverte.
      document.documentElement.classList.toggle('modal-open', open);
      onCleanup(() => document.documentElement.classList.remove('modal-open'));
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
      summary: gameRating.summary,
      developers: gameRating.developers,
      publishers: gameRating.publishers,
      platforms: gameRating.platforms,
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

  /**
   * Appelée par le bouton, le clic sur le fond, la touche Échap et l'événement natif
   * `close`. Elle est idempotente, ces chemins pouvant se déclencher ensemble.
   * <p>
   * Échap est intercepté explicitement en plus de `(close)` : certains moteurs ne
   * dispatchent pas l'événement `close`, et le signal resterait alors positionné alors
   * que le dialog est refermé — page verrouillée, sans modal visible.
   */
  closeModal(): void {
    this.selectedRating.set(null);
  }

  /**
   * Le contenu remplit toute la boîte du <dialog> : un clic dont la cible est le dialog
   * lui-même ne peut donc venir que du ::backdrop.
   */
  onBackdropClick(event: MouseEvent): void {
    if (event.target === this.detailDialog()?.nativeElement) {
      this.closeModal();
    }
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
