import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  phosphorCalendarBlankDuotone,
  phosphorFireDuotone,
  phosphorImageDuotone,
  phosphorMagnifyingGlassDuotone,
  phosphorTrophyDuotone
} from '@ng-icons/phosphor-icons/duotone';
import { debounceTime, distinctUntilChanged, filter, finalize, switchMap } from 'rxjs';
import { HomeService } from '../../data-access/home.service';
import { IgdbApiService } from '../../../igdb/data-access/igdb-api.service';
import { IgdbGame } from '../../../igdb/models/igdb-game.model';
import { CommunityService } from '../../../community/data-access/community.service';
import { CommunityGame } from '../../../community/models/community.model';
import { AuthService } from '../../../../core/auth/auth.service';
import { RatingService } from '../../../../core/rating/rating.service';
import { NotePickerComponent } from '../../../../shared/rating/note-picker.component';
import { ratingColor } from '../../../../shared/rating/rating-color';

const TOP_GAMES = 6;
const UPCOMING_GAMES = 8;
const MIN_QUERY_LENGTH = 2;

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [DatePipe, ReactiveFormsModule, RouterLink, NgIcon, NotePickerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './home-page.component.html',
  styleUrl: './home-page.component.scss',
  providers: [
    provideIcons({
      phosphorMagnifyingGlassDuotone,
      phosphorTrophyDuotone,
      phosphorCalendarBlankDuotone,
      phosphorFireDuotone,
      phosphorImageDuotone
    })
  ]
})
export class HomePageComponent {
  private readonly homeService = inject(HomeService);
  private readonly igdbApi = inject(IgdbApiService);
  private readonly communityService = inject(CommunityService);
  private readonly ratingService = inject(RatingService);
  private readonly router = inject(Router);

  protected readonly auth = inject(AuthService);
  protected readonly ratingColor = ratingColor;

  readonly query = new FormControl('', { nonNullable: true });

  readonly results = signal<IgdbGame[]>([]);
  readonly searching = signal(false);
  readonly searchError = signal('');

  readonly topGames = signal<CommunityGame[]>([]);
  readonly topLoading = signal(true);

  readonly upcoming = signal<IgdbGame[]>([]);
  readonly upcomingLoading = signal(true);
  readonly upcomingError = signal('');

  /** Notes déjà attribuées, pour préremplir les sélecteurs des résultats de recherche. */
  readonly myRatings = signal<Map<number, number>>(new Map());

  /**
   * `query` est un FormControl, pas un signal : lire `query.value` dans un computed ne crée
   * aucune dépendance et le calcul ne serait jamais réévalué. On passe donc la valeur en
   * signal, sans debounce ici pour que le bloc de résultats apparaisse dès la frappe.
   */
  private readonly queryText = toSignal(this.query.valueChanges, { initialValue: '' });

  readonly hasQuery = computed(() => this.queryText().trim().length >= MIN_QUERY_LENGTH);

  constructor() {
    this.communityService.getRanking(0, TOP_GAMES).pipe(
      finalize(() => this.topLoading.set(false))
    ).subscribe({
      next: ranking => this.topGames.set(ranking.games),
      error: () => this.topGames.set([])
    });

    this.homeService.getUpcoming(UPCOMING_GAMES).pipe(
      finalize(() => this.upcomingLoading.set(false))
    ).subscribe({
      next: games => this.upcoming.set(games),
      error: () => this.upcomingError.set('Les sorties à venir sont indisponibles pour le moment.')
    });

    if (this.auth.isAuthenticated()) {
      this.ratingService.getCollection().subscribe({
        next: collection => this.myRatings.set(new Map(collection.map(r => [r.igdbGameId, r.rating]))),
        error: () => {}
      });
    }

    this.query.valueChanges.pipe(
      debounceTime(350),
      distinctUntilChanged(),
      filter(value => value.trim().length >= MIN_QUERY_LENGTH),
      switchMap(value => {
        this.searching.set(true);
        this.searchError.set('');
        return this.igdbApi.search(value.trim()).pipe(finalize(() => this.searching.set(false)));
      })
    ).subscribe({
      next: games => this.results.set(games),
      error: () => {
        this.results.set([]);
        this.searchError.set('La recherche est indisponible pour le moment.');
      }
    });
  }

  clearSearch(): void {
    this.query.setValue('');
    this.results.set([]);
    this.searchError.set('');
  }

  ratingFor(game: IgdbGame): number | null {
    return this.myRatings().get(game.igdbId) ?? null;
  }

  rate(game: IgdbGame, note: number): void {
    if (!this.auth.isAuthenticated()) {
      this.router.navigateByUrl('/login');
      return;
    }

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
      const next = new Map(this.myRatings());
      next.set(saved.igdbGameId, saved.rating);
      this.myRatings.set(next);
    });
  }

  formatAverage(average: number): string {
    return average.toFixed(1);
  }

  /** « dans 3 mois », « le mois prochain »… plus parlant qu'une date brute pour une sortie. */
  countdown(releaseDate: number | null): string {
    if (!releaseDate) {
      return 'Date inconnue';
    }

    const days = Math.ceil((releaseDate * 1000 - Date.now()) / 86_400_000);

    if (days <= 0) {
      return "Sortie imminente";
    }
    if (days === 1) {
      return 'Demain';
    }
    if (days < 31) {
      return `Dans ${days} jours`;
    }

    const months = Math.round(days / 30);
    return months <= 1 ? 'Dans un mois' : `Dans ${months} mois`;
  }
}
