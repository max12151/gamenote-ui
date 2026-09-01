import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  phosphorArrowLeftDuotone,
  phosphorChartBarDuotone,
  phosphorChatsCircleDuotone,
  phosphorGameControllerDuotone,
  phosphorImageDuotone,
  phosphorTrophyDuotone
} from '@ng-icons/phosphor-icons/duotone';
import { finalize } from 'rxjs';
import { AuthService } from '../../../../core/auth/auth.service';
import { UserAvatarComponent } from '../../../../shared/avatar/user-avatar.component';
import { ratingColor } from '../../../../shared/rating/rating-color';
import { ProfileService } from '../../data-access/profile.service';
import { PublicProfile } from '../../models/public-profile.model';

@Component({
  selector: 'app-public-profile-page',
  standalone: true,
  imports: [DatePipe, DecimalPipe, RouterLink, NgIcon, UserAvatarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './public-profile-page.component.html',
  styleUrl: './public-profile-page.component.scss',
  providers: [
    provideIcons({
      phosphorArrowLeftDuotone,
      phosphorChartBarDuotone,
      phosphorChatsCircleDuotone,
      phosphorGameControllerDuotone,
      phosphorImageDuotone,
      phosphorTrophyDuotone
    })
  ]
})
export class PublicProfilePageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly profileService = inject(ProfileService);
  private readonly auth = inject(AuthService);

  protected readonly ratingColor = ratingColor;

  readonly profile = signal<PublicProfile | null>(null);
  readonly loading = signal(true);
  readonly notFound = signal(false);

  /** Sur sa propre page, on renvoie vers le vrai profil, celui qu'on peut modifier. */
  readonly isMe = computed(() => this.auth.currentUser()?.id === this.profile()?.id);

  /** Plus haut compte de la répartition : référence de largeur pour les autres barres. */
  private readonly topGenreShare = computed(() => {
    const counts = this.profile()?.genreBreakdown.map(genre => genre.count) ?? [];
    return counts.length ? Math.max(...counts) : 0;
  });

  constructor() {
    // On suit paramMap plutôt que le snapshot : depuis un profil, cliquer l'auteur d'un
    // commentaire mène à un autre profil, et le routeur réutilise alors ce composant.
    this.route.paramMap.pipe(takeUntilDestroyed()).subscribe(params => {
      this.load(Number(params.get('id')));
    });
  }

  barWidth(count: number): string {
    const max = this.topGenreShare();
    return max === 0 ? '0%' : `${Math.max((count / max) * 100, 6)}%`;
  }

  private load(userId: number): void {
    this.profile.set(null);
    this.notFound.set(false);
    this.loading.set(true);

    if (!Number.isInteger(userId) || userId <= 0) {
      this.loading.set(false);
      this.notFound.set(true);
      return;
    }

    this.profileService.getPublicProfile(userId).pipe(
      finalize(() => this.loading.set(false))
    ).subscribe({
      next: profile => this.profile.set(profile),
      error: () => this.notFound.set(true)
    });
  }
}
