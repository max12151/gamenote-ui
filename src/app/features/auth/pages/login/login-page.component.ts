import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../../../../core/auth/auth.service';

@Component({
  selector: 'app-login-page',
  imports: [ReactiveFormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './login-page.component.html',
  styleUrl: './login-page.component.scss'
})
export class LoginPageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly form = this.fb.nonNullable.group({
    username: ['', [Validators.required]],
    password: ['', [Validators.required]]
  });

  readonly loading = signal(false);
  readonly error = signal('');

  /**
   * Où aller une fois connecté : la page que l'utilisateur voulait voir quand sa session a
   * expiré, sinon son profil.
   *
   * Seuls les chemins internes sont acceptés. Un paramètre d'URL est écrit par n'importe
   * qui : sans ce filtre, un lien `/login?retour=https://…` renverrait la victime sur un
   * site tiers juste après une connexion réussie, au moment où elle a le moins de raisons
   * de se méfier.
   */
  private returnUrl(): string {
    const demande = this.route.snapshot.queryParamMap.get('retour');

    return demande && demande.startsWith('/') && !demande.startsWith('//')
      ? demande
      : '/profil';
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.error.set('');

    this.auth.login(this.form.getRawValue()).pipe(
      finalize(() => this.loading.set(false))
    ).subscribe({
      next: () => this.router.navigateByUrl(this.returnUrl()),
      error: (err: HttpErrorResponse) => this.error.set(err.error?.message ?? 'Identifiants invalides.')
    });
  }
}
