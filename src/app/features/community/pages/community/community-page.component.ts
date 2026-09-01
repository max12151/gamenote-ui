import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  phosphorChatsCircleDuotone,
  phosphorImageDuotone,
  phosphorMagnifyingGlassDuotone,
  phosphorMedalDuotone
} from '@ng-icons/phosphor-icons/duotone';
import { debounceTime, distinctUntilChanged, finalize } from 'rxjs';
import { CommunityService } from '../../data-access/community.service';
import { CommunityGame } from '../../models/community.model';
import { ratingColor } from '../../../../shared/rating/rating-color';

const PAGE_SIZE = 20;

@Component({
  selector: 'app-community-page',
  standalone: true,
  imports: [RouterLink, ReactiveFormsModule, NgIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './community-page.component.html',
  styleUrl: './community-page.component.scss',
  providers: [
    provideIcons({
      phosphorImageDuotone,
      phosphorChatsCircleDuotone,
      phosphorMedalDuotone,
      phosphorMagnifyingGlassDuotone
    })
  ]
})
export class CommunityPageComponent {
  private readonly communityService = inject(CommunityService);

  protected readonly ratingColor = ratingColor;

  readonly search = new FormControl('', { nonNullable: true });

  readonly games = signal<CommunityGame[]>([]);
  readonly totalGames = signal(0);
  readonly loading = signal(true);
  readonly loadingMore = signal(false);
  readonly error = signal('');

  readonly hasMore = computed(() => this.games().length < this.totalGames());

  /** Un FormControl n'est pas un signal : sans ce relais, le template ne réagirait pas. */
  private readonly searchText = toSignal(this.search.valueChanges, { initialValue: '' });

  readonly isSearching = computed(() => this.searchText().trim().length > 0);

  private nextPage = 0;

  /**
   * Terme réellement demandé au serveur. Les réponses arrivant dans le désordre quand on
   * tape vite, on écarte celles qui ne correspondent plus à la recherche en cours — sinon
   * un résultat périmé viendrait s'ajouter à une liste déjà vidée.
   */
  private pendingSearch = '';

  constructor() {
    this.loadPage();

    this.search.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntilDestroyed()
    ).subscribe(() => this.restart());
  }

  loadMore(): void {
    if (!this.loadingMore() && this.hasMore()) {
      this.loadingMore.set(true);
      this.loadPage();
    }
  }

  clearSearch(): void {
    this.search.setValue('');
  }

  /** Une note moyenne se lit mieux avec une décimale qu'avec les seize du double. */
  formatAverage(average: number): string {
    return average.toFixed(1);
  }

  /** Repart de la première page : le classement filtré n'a rien à voir avec le précédent. */
  private restart(): void {
    this.nextPage = 0;
    this.games.set([]);
    this.error.set('');
    this.loading.set(true);
    this.loadPage();
  }

  private loadPage(): void {
    const term = this.search.value.trim();
    this.pendingSearch = term;

    this.communityService.getRanking(this.nextPage, PAGE_SIZE, term).pipe(
      finalize(() => {
        this.loading.set(false);
        this.loadingMore.set(false);
      })
    ).subscribe({
      next: ranking => {
        if (term !== this.pendingSearch) {
          return;
        }

        this.nextPage += 1;
        this.totalGames.set(ranking.totalGames);
        this.games.update(list => [...list, ...ranking.games]);
      },
      error: (err: HttpErrorResponse) =>
        this.error.set(err.error?.message ?? 'Impossible de charger les avis des joueurs.')
    });
  }
}
