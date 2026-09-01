import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  effect,
  inject,
  signal,
  viewChild
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  phosphorChatsCircleDuotone,
  phosphorImageDuotone,
  phosphorXDuotone
} from '@ng-icons/phosphor-icons/duotone';
import { phosphorXBold } from '@ng-icons/phosphor-icons/bold';
import { debounceTime, distinctUntilChanged, filter, finalize, map, switchMap } from 'rxjs';
import { IgdbApiService } from '../../data-access/igdb-api.service';
import { IgdbGame } from '../../models/igdb-game.model';
import { AuthService } from '../../../../core/auth/auth.service';
import { RatingService } from '../../../../core/rating/rating.service';
import { NotePickerComponent } from '../../../../shared/rating/note-picker.component';

@Component({
  selector: 'app-igdb-search-page',
  standalone: true,
  imports: [DatePipe, ReactiveFormsModule, RouterLink, NotePickerComponent, NgIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './igdb-search-page.component.html',
  styleUrl: './igdb-search-page.component.scss',
  providers: [provideIcons({ phosphorImageDuotone, phosphorXDuotone, phosphorXBold, phosphorChatsCircleDuotone })]
})
export class IgdbSearchPageComponent {
  private readonly api = inject(IgdbApiService);
  private readonly ratingService = inject(RatingService);
  protected readonly auth = inject(AuthService);

  readonly query = new FormControl('', { nonNullable: true });
  readonly results = signal<IgdbGame[]>([]);
  readonly loading = signal(false);
  readonly error = signal('');
  readonly ratings = signal<Map<number, number>>(new Map());
  readonly selectedGame = signal<IgdbGame | null>(null);

  private readonly detailDialog = viewChild<ElementRef<HTMLDialogElement>>('detailDialog');


  constructor() {
    // Le <dialog> natif se pilote par methodes imperatives : on le synchronise sur le
    // signal, qui reste la source de verite pour le template.
    effect(onCleanup => {
      const dialog = this.detailDialog()?.nativeElement;

      if (!dialog) {
        return;
      }

      const open = this.selectedGame() !== null;

      if (open && !dialog.open) {
        // showModal() donne le focus au dialog et fait defiler le document jusqu'a lui :
        // sans cette restauration, ouvrir une fiche depuis le bas des resultats renvoie
        // en haut de liste et decale la modal hors de l'ecran.
        const scrollY = window.scrollY;
        dialog.showModal();
        window.scrollTo({ top: scrollY, behavior: 'instant' });
      } else if (!open && dialog.open) {
        dialog.close();
      }

      document.documentElement.classList.toggle('modal-open', open);
      onCleanup(() => document.documentElement.classList.remove('modal-open'));
    });

    if (this.auth.isAuthenticated()) {
      this.ratingService.getCollection().subscribe(collection => {
        this.ratings.set(new Map(collection.map(r => [r.igdbGameId, r.rating])));
      });
    }

    this.query.valueChanges.pipe(
      debounceTime(350), distinctUntilChanged(),
      filter(value => value.trim().length >= 2),
      map( value =>{
        const trimmed = value.trim();
        if(trimmed == "le meilleur jeu") {
          return 'outer wilds'
        }
        return trimmed;
      }),
      switchMap(value => {
        this.loading.set(true); this.error.set('');
        return this.api.search(value.trim()).pipe(finalize(() => this.loading.set(false)));
      })
    ).subscribe({
      next: games => this.results.set(games),
      error: () => { this.results.set([]); this.error.set('La recherche IGDB est indisponible. Vérifie le backend et tes clés Twitch.  (en vrai, le réseau technifutur bloque igdb et je dois demander de changer)'); }
    });
  }

  search(): void {
    const value = this.query.value.trim();
    if (value.length >= 2) this.query.setValue(value);
  }

  ratingFor(game: IgdbGame): number | null {
    return this.ratings().get(game.igdbId) ?? null;
  }

  igdbRating(game: IgdbGame): number | null {
    const value = game.aggregatedRating ?? game.rating;
    return value !== null ? Math.round(value) : null;
  }

  rate(game: IgdbGame, note: number): void {
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
    }).subscribe(saved => {
      const next = new Map(this.ratings());
      next.set(saved.igdbGameId, saved.rating);
      this.ratings.set(next);
    });
  }

  openModal(game: IgdbGame): void {
    this.selectedGame.set(game);
  }

  /**
   * Appelee par le bouton, le clic sur le fond, Echap et l'evenement natif `close`.
   * Idempotente : ces chemins peuvent se declencher ensemble. Echap est intercepte en
   * plus de `(close)`, certains moteurs ne dispatchant pas cet evenement.
   */
  closeModal(): void {
    this.selectedGame.set(null);
  }

  /** Le contenu remplit la boite : un clic visant le <dialog> vient donc du ::backdrop. */
  onBackdropClick(event: MouseEvent): void {
    if (event.target === this.detailDialog()?.nativeElement) {
      this.closeModal();
    }
  }
}
