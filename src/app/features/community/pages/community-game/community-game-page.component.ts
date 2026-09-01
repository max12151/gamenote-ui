import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { DatePipe } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  phosphorChatsCircleDuotone,
  phosphorImageDuotone,
  phosphorShieldCheckDuotone
} from '@ng-icons/phosphor-icons/duotone';
import { phosphorArrowLeftBold, phosphorTrashBold } from '@ng-icons/phosphor-icons/bold';
import { finalize } from 'rxjs';
import { CommunityService } from '../../data-access/community.service';
import { CommunityGameDetail, GameComment } from '../../models/community.model';
import { AuthService } from '../../../../core/auth/auth.service';
import { RatingService } from '../../../../core/rating/rating.service';
import { NotePickerComponent } from '../../../../shared/rating/note-picker.component';
import { AuthorLinkComponent } from '../../../../shared/author/author-link.component';
import { ratingColor } from '../../../../shared/rating/rating-color';

const MAX_COMMENT_LENGTH = 2000;

@Component({
  selector: 'app-community-game-page',
  standalone: true,
  imports: [DatePipe, RouterLink, NgIcon, NotePickerComponent, AuthorLinkComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './community-game-page.component.html',
  styleUrl: './community-game-page.component.scss',
  providers: [
    provideIcons({
      phosphorImageDuotone,
      phosphorChatsCircleDuotone,
      phosphorShieldCheckDuotone,
      phosphorArrowLeftBold,
      phosphorTrashBold
    })
  ]
})
export class CommunityGamePageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly communityService = inject(CommunityService);
  private readonly ratingService = inject(RatingService);
  private readonly auth = inject(AuthService);

  protected readonly ratingColor = ratingColor;
  protected readonly maxCommentLength = MAX_COMMENT_LENGTH;

  /** L'histogramme affiche les dix notes possibles, y compris celles que personne n'a mises. */
  readonly notes = Array.from({ length: 10 }, (_, index) => 10 - index);

  readonly detail = signal<CommunityGameDetail | null>(null);
  readonly loading = signal(true);
  readonly error = signal('');

  readonly draft = signal('');
  readonly editing = signal(false);
  readonly saving = signal(false);
  readonly commentError = signal('');
  readonly deletingCommentId = signal<number | null>(null);

  readonly rating = signal(false);
  readonly ratingError = signal('');

  readonly isAdmin = computed(() => this.auth.currentUser()?.role === 'ADMIN');

  /** Plus haute barre de l'histogramme : sert de référence pour la largeur des autres. */
  readonly maxBucketCount = computed(() => {
    const counts = this.detail()?.distribution.map(bucket => bucket.count) ?? [];
    return counts.length ? Math.max(...counts) : 0;
  });

  private readonly igdbGameId = signal(0);

  constructor() {
    // On suit paramMap plutôt que le snapshot : le routeur réutilise le composant quand
    // seul l'identifiant change, et un snapshot laisserait alors la fiche du jeu précédent.
    this.route.paramMap.pipe(takeUntilDestroyed()).subscribe(params => {
      this.igdbGameId.set(Number(params.get('igdbGameId')));
      this.load();
    });
  }

  private load(): void {
    this.loading.set(true);
    this.error.set('');
    this.detail.set(null);
    this.cancelEditing();

    this.communityService.getGameDetail(this.igdbGameId()).pipe(
      finalize(() => this.loading.set(false))
    ).subscribe({
      next: detail => this.detail.set(detail),
      error: (err: HttpErrorResponse) =>
        this.error.set(err.error?.message ?? 'Impossible de charger les avis sur ce jeu.')
    });
  }

  /**
   * Recharge sans vider l'affichage : après une note, la fiche est déjà à l'écran et la
   * repasser par l'état « chargement » ferait clignoter toute la page.
   */
  private reload(): void {
    this.communityService.getGameDetail(this.igdbGameId()).subscribe({
      next: detail => this.detail.set(detail),
      error: (err: HttpErrorResponse) =>
        this.ratingError.set(err.error?.message ?? 'Impossible de rafraîchir la fiche.')
    });
  }

  formatAverage(average: number): string {
    return average.toFixed(1);
  }

  barWidth(count: number): string {
    const max = this.maxBucketCount();
    return max === 0 ? '0%' : `${(count / max) * 100}%`;
  }

  countForRating(rating: number): number {
    return this.detail()?.distribution.find(bucket => bucket.rating === rating)?.count ?? 0;
  }

  startEditing(): void {
    this.draft.set(this.detail()?.myComment?.content ?? '');
    this.commentError.set('');
    this.editing.set(true);
  }

  cancelEditing(): void {
    this.editing.set(false);
    this.draft.set('');
    this.commentError.set('');
  }

  saveComment(): void {
    const content = this.draft().trim();

    if (!content || this.saving()) {
      return;
    }

    this.saving.set(true);
    this.commentError.set('');

    this.communityService.saveComment(this.igdbGameId(), content).pipe(
      finalize(() => this.saving.set(false))
    ).subscribe({
      next: saved => {
        this.applySavedComment(saved);
        this.cancelEditing();
      },
      error: (err: HttpErrorResponse) =>
        this.commentError.set(err.error?.message ?? "Impossible d'enregistrer ton avis.")
    });
  }

  deleteComment(comment: GameComment): void {
    if (this.deletingCommentId() !== null) {
      return;
    }

    this.deletingCommentId.set(comment.id);

    this.communityService.deleteComment(comment.id).pipe(
      finalize(() => this.deletingCommentId.set(null))
    ).subscribe({
      next: () => this.removeComment(comment.id),
      error: (err: HttpErrorResponse) =>
        this.commentError.set(err.error?.message ?? 'Impossible de supprimer ce commentaire.')
    });
  }

  /**
   * Noter depuis cette page. Toutes les métadonnées nécessaires sont déjà dans la fiche,
   * inutile de repasser par IGDB. On recharge ensuite le détail : la moyenne, le nombre de
   * votes et l'histogramme viennent de changer, et le droit de commenter avec.
   */
  rate(note: number): void {
    const detail = this.detail();

    if (!detail || this.rating()) {
      return;
    }

    this.rating.set(true);
    this.ratingError.set('');

    this.ratingService.rateGame({
      igdbGameId: detail.game.igdbGameId,
      title: detail.game.title,
      coverUrl: detail.game.coverUrl,
      releaseDate: detail.game.releaseDate,
      genres: detail.game.genres,
      summary: detail.game.summary,
      developers: detail.game.developers,
      publishers: detail.game.publishers,
      platforms: detail.game.platforms,
      rating: note
    }).pipe(
      finalize(() => this.rating.set(false))
    ).subscribe({
      next: () => this.reload(),
      error: (err: HttpErrorResponse) =>
        this.ratingError.set(err.error?.message ?? "Impossible d'enregistrer ta note.")
    });
  }

  private applySavedComment(saved: GameComment): void {
    this.detail.update(detail => {
      if (!detail) {
        return detail;
      }

      const withoutMine = detail.comments.filter(comment => comment.id !== saved.id);
      return { ...detail, myComment: saved, comments: [saved, ...withoutMine] };
    });
  }

  private removeComment(commentId: number): void {
    this.detail.update(detail => {
      if (!detail) {
        return detail;
      }

      return {
        ...detail,
        comments: detail.comments.filter(comment => comment.id !== commentId),
        myComment: detail.myComment?.id === commentId ? null : detail.myComment
      };
    });
  }
}
