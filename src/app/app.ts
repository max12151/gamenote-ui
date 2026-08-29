import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  phosphorChatsCircleDuotone,
  phosphorCompassDuotone,
  phosphorHouseDuotone,
  phosphorGameControllerDuotone,
  phosphorMagnifyingGlassDuotone,
  phosphorSignInDuotone,
  phosphorSignOutDuotone,
  phosphorStackDuotone,
  phosphorUserCircleDuotone,
  phosphorUserPlusDuotone
} from '@ng-icons/phosphor-icons/duotone';
import { AuthService } from './core/auth/auth.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, NgIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './app.html',
  styleUrl: './app.scss',
  providers: [
    provideIcons({
      phosphorChatsCircleDuotone,
      phosphorCompassDuotone,
      phosphorHouseDuotone,
      phosphorGameControllerDuotone,
      phosphorMagnifyingGlassDuotone,
      phosphorStackDuotone,
      phosphorUserCircleDuotone,
      phosphorSignInDuotone,
      phosphorSignOutDuotone,
      phosphorUserPlusDuotone
    })
  ]
})
export class App {
  protected readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  logout(): void {
    this.auth.logout();
    this.router.navigateByUrl('/login');
  }
}
