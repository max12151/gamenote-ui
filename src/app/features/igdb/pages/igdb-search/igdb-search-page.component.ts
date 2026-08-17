import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged, filter, finalize, map, switchMap } from 'rxjs';
import { IgdbApiService } from '../../data-access/igdb-api.service';
import { IgdbGame } from '../../models/igdb-game.model';

@Component({
  selector: 'app-igdb-search-page',
  standalone: true,
  imports: [DatePipe, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './igdb-search-page.component.html',
  styleUrl: './igdb-search-page.component.scss'
})
export class IgdbSearchPageComponent {
  private readonly api = inject(IgdbApiService);
  readonly query = new FormControl('', { nonNullable: true });
  readonly results = signal<IgdbGame[]>([]);
  readonly loading = signal(false);
  readonly error = signal('');


  constructor() {
    this.query.valueChanges.pipe(
      debounceTime(350), distinctUntilChanged(),
      filter(value => value.trim().length >= 2),
      map( value =>{
        const trimmed = value.trim();
        if(trimmed == "le meilleur jeu") {
          return 'outer wilds'
        }
        return trimmed;
      }),
      switchMap(value => {
        this.loading.set(true); this.error.set('');
        return this.api.search(value.trim()).pipe(finalize(() => this.loading.set(false)));
      })
    ).subscribe({
      next: games => this.results.set(games),
      error: () => { this.results.set([]); this.error.set('La recherche IGDB est indisponible. Vérifie le backend et tes clés Twitch.  (en vrai, le wifi technifutur bloque igdb et je dois demander de changer)'); }
    });
  }

  search(): void {
    const value = this.query.value.trim();
    if (value.length >= 2) this.query.setValue(value);
  }
}
