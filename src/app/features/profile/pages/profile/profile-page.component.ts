import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../../../../core/auth/auth.service';
import { ProfileService } from '../../data-access/profile.service';

@Component({
  selector: 'app-profile-page',
  imports: [ReactiveFormsModule, DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './profile-page.component.html',
  styleUrl: './profile-page.component.scss'
})
export class ProfilePageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly profileService = inject(ProfileService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly user = this.auth.currentUser;
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly editing = signal(false);
  readonly error = signal('');
  readonly success = signal('');

  readonly form = this.fb.nonNullable.group({
    bio: ['', [Validators.maxLength(1000)]],
    avatarUrl: ['', [Validators.maxLength(2048)]]
  });

  constructor() {
    this.profileService.getCurrentProfile().pipe(
      finalize(() => this.loading.set(false))
    ).subscribe({
      next: user => this.resetFormFrom(user),
      error: () => this.error.set("Impossible de charger le profil.")
    });
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

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    this.error.set('');
    this.success.set('');

    this.profileService.updateProfile(this.form.getRawValue()).pipe(
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
      bio: user.bio ?? '',
      avatarUrl: user.avatarUrl ?? ''
    });
  }
}
