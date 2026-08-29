import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  phosphorChatsCircleDuotone,
  phosphorImageDuotone,
  phosphorMedalDuotone
} from '@ng-icons/phosphor-icons/duotone';
import { finalize } from 'rxjs';
import { CommunityService } from '../../data-access/community.service';
import { CommunityGame } from '../../models/community.model';
import { ratingColor } from '../../../../shared/rating/rating-color';

const PAGE_SIZE = 20;

@Component({
  selector: 'app-community-page',
  standalone: true,
  imports: [RouterLink, NgIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './community-page.component.html',
  styleUrl: './community-page.component.scss',
  providers: [provideIcons({ phosphorImageDuotone, phosphorChatsCircleDuotone, phosphorMedalDuotone })]
})
export class CommunityPageComponent {
  private readonly communityService = inject(CommunityService);

  protected readonly ratingColor = ratingColor;

  readonly games = signal<CommunityGame[]>([]);
  readonly totalGames = signal(0);
  readonly loading = signal(true);
  readonly loadingMore = signal(false);
  readonly error = signal('');

  readonly hasMore = computed(() => this.games().length < this.totalGames());

  private nextPage = 0;

  constructor() {
    this.loadPage();
  }

  loadMore(): void {
    if (!this.loadingMore() && this.hasMore()) {
      this.loadingMore.set(true);
      this.loadPage();
    }
  }

  /** Une note moyenne se lit mieux avec une décimale qu'avec les seize du double. */
  formatAverage(average: number): string {
    return average.toFixed(1);
  }

  private loadPage(): void {
    this.communityService.getRanking(this.nextPage, PAGE_SIZE).pipe(
      finalize(() => {
        this.loading.set(false);
        this.loadingMore.set(false);
      })
    ).subscribe({
      next: ranking => {
        this.nextPage += 1;
        this.totalGames.set(ranking.totalGames);
        this.games.update(list => [...list, ...ranking.games]);
      },
      error: (err: HttpErrorResponse) =>
        this.error.set(err.error?.message ?? 'Impossible de charger les avis des joueurs.')
    });
  }
}
