import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { ratingColor } from './rating-color';

@Component({
  selector: 'app-note-picker',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './note-picker.component.html',
  styleUrl: './note-picker.component.scss'
})
export class NotePickerComponent {
  readonly value = input<number | null>(null);
  readonly disabled = input(false);
  readonly size = input<'normal' | 'compact'>('normal');
  readonly showCurrentValue = input(true);
  readonly valueChange = output<number>();

  readonly hoverValue = signal<number | null>(null);
  readonly notes = Array.from({ length: 10 }, (_, i) => i + 1);

  pick(note: number): void {
    if (this.disabled()) {
      return;
    }
    this.valueChange.emit(note);
  }

  onHover(note: number | null): void {
    if (!this.disabled()) {
      this.hoverValue.set(note);
    }
  }

  isFilled(note: number): boolean {
    const reference = this.hoverValue() ?? this.value();
    return reference !== null && note <= reference;
  }

  colorFor(note: number): string {
    return ratingColor(note);
  }
}
