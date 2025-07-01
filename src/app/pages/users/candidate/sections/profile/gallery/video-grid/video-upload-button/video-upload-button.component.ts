// video-upload-button.component.ts
import { CommonModule } from '@angular/common';
import { Component, Output, EventEmitter, Input, inject, NgZone } from '@angular/core';
import { runInInjectionContext, EnvironmentInjector } from '@angular/core';
import { Storage, ref, uploadBytesResumable, getDownloadURL } from '@angular/fire/storage';
import { ToastService } from 'src/app/shared/services/toast.service';
import { User } from '@angular/fire/auth';

@Component({
  selector: 'app-video-upload-button',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './video-upload-button.component.html',
  styleUrls: ['./video-upload-button.component.css'],
})
export class VideoUploadButtonComponent {
  @Input() userEmailKey: string | null = null;
  @Input() currentUser: User | null = null;
  @Output() uploadComplete = new EventEmitter<string>();
  @Output() uploadProgress = new EventEmitter<{ progress: number, uploaded: number, total: number }>();

  private injector = inject(EnvironmentInjector);
  private storage = inject(Storage);
  private toast = inject(ToastService);
  private ngZone = inject(NgZone);

  async onFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;

    const file = input.files[0];
    if (!file.type.startsWith('video/')) {
      this.toast.show('Formato de archivo inválido. Solo se permiten videos.', 'error');
      input.value = '';
      return;
    }

    if (!this.userEmailKey) {
      this.toast.show('No se pudo identificar al usuario', 'error');
      return;
    }
    await this.uploadVideo(file);
  }

  private async uploadVideo(file: File): Promise<void> {
    return runInInjectionContext(this.injector, async () => {
      const videoName = `gallery-video-${Date.now()}.${file.name.split('.').pop()}`;
      const storageRef = ref(this.storage, `cv-app/users/${this.userEmailKey}/gallery-videos/${videoName}`);
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
          this.uploadProgress.emit({
            progress,
            uploaded: snapshot.bytesTransferred,
            total: snapshot.totalBytes
          });
        },
        (error) => {
          this.ngZone.run(() => {
            this.toast.show('Error al subir el video', 'error');
            console.error('Upload error:', error);
          });
        },
        () => {
          runInInjectionContext(this.injector, async () => {
            try {
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
              this.uploadComplete.emit(downloadURL);
              this.ngZone.run(() => {
                this.toast.show('Video subido exitosamente', 'success');
              });
            } catch (error) {
              this.ngZone.run(() => {
                this.toast.show('Error al obtener URL del video', 'error');
                console.error('Error getting download URL:', error);
              });
            }
          });
        }
      );
    });
  }
}