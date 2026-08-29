import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../../../../core/auth/auth.service';
import { RatingStats } from '../../../../core/models/rating-stats.model';
import { RatingService } from '../../../../core/rating/rating.service';
import { AvatarUploadComponent } from '../../../../shared/avatar-upload/avatar-upload.component';
import { ProfileService } from '../../data-access/profile.service';
import { ratingColor } from '../../../../shared/rating/rating-color';

@Component({
  selector: 'app-profile-page',
  imports: [ReactiveFormsModule, DatePipe, DecimalPipe, AvatarUploadComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './profile-page.component.html',
  styleUrl: './profile-page.component.scss'
})
export class ProfilePageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly profileService = inject(ProfileService);
  private readonly ratingService = inject(RatingService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly user = this.auth.currentUser;
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly editing = signal(false);
  readonly error = signal('');
  readonly success = signal('');

  readonly stats = signal<RatingStats | null>(null);
  readonly statsLoading = signal(true);

  protected readonly ratingColor = ratingColor;

  /** Plus haute barre de l'histogramme : référence de hauteur pour toutes les autres. */
  readonly maxRatingCount = computed(() => {
    const counts = this.stats()?.ratingDistribution.map(bucket => bucket.count) ?? [];
    return counts.length ? Math.max(...counts) : 0;
  });

  readonly avatarUrl = signal('');

  readonly form = this.fb.nonNullable.group({
    bio: ['', [Validators.maxLength(1000)]]
  });

  constructor() {
    this.profileService.getCurrentProfile().pipe(
      finalize(() => this.loading.set(false))
    ).subscribe({
      next: user => this.resetFormFrom(user),
      error: () => this.error.set("Impossible de charger le profil.")
    });

    this.ratingService.getStats().pipe(
      finalize(() => this.statsLoading.set(false))
    ).subscribe({
      next: stats => this.stats.set(stats),
      error: () => {}
    });
  }

  /** Hauteur relative d'une barre de l'histogramme, en pourcentage de la plus haute. */
  barHeight(count: number): string {
    const max = this.maxRatingCount();
    if (max === 0 || count === 0) {
      return '2px';
    }
    return `${Math.max((count / max) * 100, 4)}%`;
  }

  /** Part d'un groupe dans la barre « sévère / aligné / généreux ». */
  sharePercent(count: number, total: number): number {
    return total === 0 ? 0 : (count / total) * 100;
  }

  /**
   * Traduit l'écart moyen en une phrase, plus parlante qu'un nombre signé.
   *
   * Le verdict se base sur la valeur arrondie, celle qui est affichée : sinon un écart de
   * -0,27 s'afficherait « -0,3 » tout en étant commenté « dans la moyenne », ce qui donne
   * l'impression d'une contradiction.
   */
  tasteVerdict(rawDelta: number): string {
    const delta = Math.round(rawDelta * 10) / 10;

    if (delta <= -1) {
      return 'Tu notes nettement plus sévèrement que le reste du site';
    }
    if (delta <= -0.3) {
      return 'Tu notes un peu plus sévèrement que le reste du site';
    }
    if (delta < 0.3) {
      return 'Tes notes collent de près à la moyenne du site';
    }
    if (delta < 1) {
      return 'Tu notes un peu plus généreusement que le reste du site';
    }
    return 'Tu notes nettement plus généreusement que le reste du site';
  }

  formatDelta(delta: number): string {
    const rounded = delta.toFixed(1).replace('.', ',');
    return delta > 0 ? `+${rounded}` : rounded;
  }

  startEditing(): void {
    this.success.set('');
    this.editing.set(true);
  }

  cancelEditing(): void {
    const current = this.user();
    if (current) {
      this.resetFormFrom(current);
    }
    this.editing.set(false);
  }

  onAvatarChange(dataUrl: string | null): void {
    this.avatarUrl.set(dataUrl ?? '');
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    this.error.set('');
    this.success.set('');

    this.profileService.updateProfile({
      bio: this.form.getRawValue().bio,
      avatarUrl: this.avatarUrl()
    }).pipe(
      finalize(() => this.saving.set(false))
    ).subscribe({
      next: () => {
        this.editing.set(false);
        this.success.set('Profil mis à jour.');
      },
      error: (err: HttpErrorResponse) => this.error.set(err.error?.message ?? 'Impossible de mettre à jour le profil.')
    });
  }

  logout(): void {
    this.auth.logout();
    this.router.navigateByUrl('/login');
  }

  private resetFormFrom(user: { bio: string | null; avatarUrl: string | null }): void {
    this.form.setValue({
      bio: user.bio ?? ''
    });
    this.avatarUrl.set(user.avatarUrl ?? '');
  }
}
