import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { UserAvatarComponent } from '../avatar/user-avatar.component';

/**
 * Identité cliquable d'un joueur : sa pastille et son pseudo, menant à son profil.
 *
 * Regroupés dans un seul lien plutôt qu'en deux liens côte à côte : deux cibles qui mènent
 * au même endroit doublent les arrêts à la tabulation et les annonces d'un lecteur d'écran,
 * sans rien apporter. La zone cliquable couvre malgré tout l'avatar comme le pseudo, ce que
 * demandait la consigne.
 *
 * Le composant suppose une session ouverte — les profils sont réservés aux membres, et les
 * pages qui l'affichent le sont aussi.
 */
@Component({
  selector: 'app-author-link',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, UserAvatarComponent],
  template: `
    <a
      class="author-link"
      [routerLink]="['/joueurs', userId()]"
      [attr.aria-label]="'Voir le profil de ' + username()"
    >
      <app-user-avatar
        [userId]="userId()"
        [username]="username()"
        [hasAvatar]="hasAvatar()"
      />
      <span class="name">{{ username() }}</span>
    </a>
  `,
  styles: `
    :host {
      display: inline-flex;
      min-width: 0;
    }

    .author-link {
      display: inline-flex;
      align-items: center;
      gap: 0.45rem;
      min-width: 0;
      padding: 0.15rem 0.5rem 0.15rem 0.15rem;
      border-radius: var(--gn-radius-pill);
      color: var(--gn-ink);
      text-decoration: none;
      transition: background 0.15s, color 0.15s;

      &:hover {
        background: var(--gn-primary-soft);
        color: var(--gn-primary-deep);
      }
    }

    .name {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      font-weight: 600;
      font-size: 0.92rem;
    }
  `
})
export class AuthorLinkComponent {
  readonly userId = input.required<number>();
  readonly username = input.required<string>();

  /** Évite une requête vouée au 404 quand le joueur n'a pas mis de photo. */
  readonly hasAvatar = input(false);
}
