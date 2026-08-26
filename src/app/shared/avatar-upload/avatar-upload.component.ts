import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { phosphorCheckDuotone, phosphorTrashSimpleDuotone, phosphorUploadSimpleDuotone } from '@ng-icons/phosphor-icons/duotone';
import { ImageCroppedEvent, ImageCropperComponent } from 'ngx-image-cropper';

const MAX_FILE_SIZE = 8 * 1024 * 1024;
const OUTPUT_SIZE = 320;

@Component({
  selector: 'app-avatar-upload',
  standalone: true,
  imports: [NgIcon, ImageCropperComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './avatar-upload.component.html',
  styleUrl: './avatar-upload.component.scss',
  providers: [provideIcons({ phosphorUploadSimpleDuotone, phosphorTrashSimpleDuotone, phosphorCheckDuotone })]
})
export class AvatarUploadComponent {
  readonly currentAvatarUrl = input<string | null>(null);
  readonly initials = input('?');
  readonly avatarChange = output<string | null>();

  readonly pendingFile = signal<File | null>(null);
  readonly dragOver = signal(false);
  readonly error = signal('');

  private lastCropResult: string | null = null;

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.dragOver.set(true);
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.dragOver.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.dragOver.set(false);
    const file = event.dataTransfer?.files?.[0];
    if (file) {
      this.acceptFile(file);
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      this.acceptFile(file);
    }
    input.value = '';
  }

  onCropped(event: ImageCroppedEvent): void {
    this.lastCropResult = event.base64 ?? null;
  }

  onLoadFailed(): void {
    this.error.set('Impossible de lire cette image.');
    this.pendingFile.set(null);
  }

  confirmCrop(): void {
    if (this.lastCropResult) {
      this.avatarChange.emit(this.lastCropResult);
    }
    this.pendingFile.set(null);
  }

  cancelCrop(): void {
    this.pendingFile.set(null);
  }

  remove(): void {
    this.avatarChange.emit(null);
  }

  private acceptFile(file: File): void {
    this.error.set('');

    if (!file.type.startsWith('image/')) {
      this.error.set('Merci de choisir un fichier image.');
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      this.error.set('Image trop volumineuse (8 Mo max).');
      return;
    }

    this.lastCropResult = null;
    this.pendingFile.set(file);
  }

  protected readonly outputSize = OUTPUT_SIZE;
}
