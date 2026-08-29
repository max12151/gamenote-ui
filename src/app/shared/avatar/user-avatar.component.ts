import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import { environment } from '../../../environments/environments';

/**
 * Pastille d'identité d'un joueur : sa photo si elle existe, ses initiales sinon.
 *
 * L'image n'est jamais transportée dans le JSON — elle est stockée en data URI base64 et
 * pèserait jusqu'à deux mégaoctets par commentaire. On pointe donc vers la route dédiée,
 * que le navigateur met en cache et ne redemande qu'à l'expiration de son ETag.
 */
@Component({
  selector: 'app-user-avatar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (showImage()) {
      <img
        [src]="src()"
        [alt]="'Avatar de ' + username()"
        loading="lazy"
        decoding="async"
        (error)="onImageError()"
      />
    } @else {
      <span
        class="initials"
        aria-hidden="true"
      >{{ initials() }}</span>
    }
  `,
  styles: `
    :host {
      display: grid;
      place-items: center;
      width: var(--avatar-size, 1.9rem);
      height: var(--avatar-size, 1.9rem);
      flex-shrink: 0;
      overflow: hidden;
      border-radius: var(--gn-radius-pill);
      background: var(--gn-primary-soft);
      color: var(--gn-primary-deep);
      font-size: calc(var(--avatar-size, 1.9rem) * 0.38);
      font-weight: 700;
      line-height: 1;
    }

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }
  `
})
export class UserAvatarComponent {
  readonly userId = input.required<number>();
  readonly username = input.required<string>();

  /** Le serveur indique s'il y a une image, ce qui évite une requête vouée au 404. */
  readonly hasAvatar = input(false);

  /** Une image supprimée entre-temps ne doit pas laisser une pastille vide. */
  private readonly loadFailed = signal(false);

  readonly showImage = computed(() => this.hasAvatar() && !this.loadFailed());
  readonly src = computed(() => `${environment.apiUrl}/api/users/${this.userId()}/avatar`);

  readonly initials = computed(() => {
    const name = this.username().trim();
    if (!name) {
      return '?';
    }

    const parts = name.split(/[\s._-]+/).filter(Boolean);
    return parts.length >= 2
      ? (parts[0][0] + parts[1][0]).toUpperCase()
      : name.slice(0, 2).toUpperCase();
  });

  onImageError(): void {
    this.loadFailed.set(true);
  }
}
