import { ChangeDetectionStrategy, Component, HostListener, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { phosphorImageDuotone, phosphorXDuotone } from '@ng-icons/phosphor-icons/duotone';
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
  providers: [provideIcons({ phosphorImageDuotone, phosphorXDuotone, phosphorXBold })]
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


  constructor() {
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

  closeModal(): void {
    this.selectedGame.set(null);
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.closeModal();
  }
}
