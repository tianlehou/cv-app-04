import { CommonModule } from '@angular/common';
import { Component, Output, EventEmitter, Input, inject, ChangeDetectorRef, NgZone, EnvironmentInjector, OnDestroy } from '@angular/core';
import { Storage, ref, uploadBytesResumable, getDownloadURL } from '@angular/fire/storage';
import { ToastService } from '../../../../../../../shared/services/toast.service';
import { runInInjectionContext } from '@angular/core';
import { ImageCompressionService } from 'src/app/shared/services/image-compression.service';

@Component({
  selector: 'app-image-upload-button',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './image-upload-button.component.html',
  styleUrls: ['./image-upload-button.component.css'],
})
export class ImageUploadButtonComponent implements OnDestroy {
  @Input() userEmailKey: string | null = null;
  @Output() uploadComplete = new EventEmitter<string>();

  // Propiedades de estado
  selectedFile: File | null = null;
  currentSnapshot: any = null;
  showProgress = false;

  private injector = inject(EnvironmentInjector);
  private storage = inject(Storage);
  private toast = inject(ToastService);
  private cdr = inject(ChangeDetectorRef);
  private ngZone = inject(NgZone);
  private imageCompression = inject(ImageCompressionService);

  async onFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;

    const file = input.files[0];
    if (!file.type.startsWith('image/')) {
      this.toast.show('Formato de archivo inválido. Solo se permiten imágenes.', 'error');
      input.value = '';
      return;
    }

    try {
      // Comprimir la imagen antes de subirla
      this.selectedFile = await this.imageCompression.compressImage(file);
      this.uploadImage();
    } catch (error) {
      console.error('Error al comprimir imagen:', error);
      this.toast.show('Error al procesar la imagen', 'error');
      input.value = '';
    }
  }

  private async uploadImage(): Promise<void> {
    if (!this.selectedFile || !this.userEmailKey) return;

    this.showProgress = true;
    this.currentSnapshot = null;

    try {
      await runInInjectionContext(this.injector, async () => {
        const imageName = `gallery-image-${Date.now()}.${this.selectedFile!.name.split('.').pop()}`;
        const storagePath = `cv-app/users/${this.userEmailKey}/gallery-images/${imageName}`;
        const storageRef = ref(this.storage, storagePath);
        const uploadTask = uploadBytesResumable(storageRef, this.selectedFile!);

        uploadTask.on(
          'state_changed',
          (snapshot) => {
            this.currentSnapshot = snapshot;
            this.cdr.detectChanges();
          },
          (error) => this.handleUploadError(error),
          async () => await this.handleUploadComplete(uploadTask)
        );
      });
    } catch (error) {
      this.handleUploadError(error);
    }
  }

  private async handleUploadComplete(uploadTask: any): Promise<void> {
    this.showProgress = false;
    const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
    this.ngZone.run(() => {
      this.toast.show('Imagen subida exitosamente', 'success');
      this.uploadComplete.emit(downloadURL);
      this.resetUploadState();
    });
  }

  private handleUploadError(error: any): void {
    this.ngZone.run(() => {
      this.showProgress = false;
      console.error('Upload error:', error);
      this.toast.show('Error al subir la imagen', 'error');
      this.resetUploadState();
    });
  }

  private resetUploadState(): void {
    this.selectedFile = null;
  }

  ngOnDestroy(): void {
    // Limpieza si es necesaria
  }
}