// video-upload-button.component.ts
import { CommonModule } from '@angular/common';
import { Component, Output, EventEmitter, Input, inject, NgZone, EnvironmentInjector, OnDestroy } from '@angular/core';
import { runInInjectionContext } from '@angular/core';
import { Storage, ref, uploadBytesResumable, getDownloadURL } from '@angular/fire/storage';
import { Database, ref as dbRef, set, get } from '@angular/fire/database';
import { ToastService } from 'src/app/shared/services/toast.service';
import { User } from '@angular/fire/auth';
import { FirebaseService } from 'src/app/shared/services/firebase.service';
import { ExamplesService } from 'src/app/shared/services/examples.service';

@Component({
  selector: 'app-video-upload-button',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './video-upload-button.component.html',
  styleUrls: ['./video-upload-button.component.css'],
})
export class VideoUploadButtonComponent implements OnDestroy {
  @Input() userEmailKey: string | null = null;
  @Input() currentUser: User | null = null;
  @Input() isExample: boolean = false;
  @Input() isEditor: boolean = false;
  @Input() readOnly: boolean = false;
  @Output() uploadComplete = new EventEmitter<string>();
  @Output() uploadProgress = new EventEmitter<{ progress: number, uploaded: number, total: number }>();

  private injector = inject(EnvironmentInjector);
  private storage = inject(Storage);
  private toast = inject(ToastService);
  private ngZone = inject(NgZone);
  private firebaseService = inject(FirebaseService);
  private examplesService = inject(ExamplesService);
  private database = inject(Database);

  // Maneja la selección de archivos desde el input
  // Verifica si el usuario tiene permisos y si el archivo es válido
  async onFileSelected(event: Event): Promise<void> {
    if (this.readOnly && !this.isEditor) {
      this.toast.show('No tienes permisos para subir videos', 'error');
      return;
    }

    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;

    const file = input.files[0];
    if (!file.type.startsWith('video/')) {
      throw new Error('Solo se permiten archivos de video');
    }

    if (file.size > 100 * 1024 * 1024) {
      this.toast.show('Solo se permiten archivos de videos.', 'error');
      input.value = '';
      return;
    }

    try {
      this.uploadVideo(file);
    } catch (error) {
      console.error('Error al subir el video:', error);
      this.toast.show('Error al procesar el video', 'error');
    } finally {
      // Limpiar el input de archivo para permitir cargar el mismo archivo nuevamente
      input.value = '';
    }
  }

  // Sube el video al almacenamiento de Firebase
  // Guarda la URL en la base de datos del usuario o del ejemplo según corresponda
  private async uploadVideo(file: File): Promise<void> {
    return runInInjectionContext(this.injector, async () => {
      const videoName = `gallery-video-${Date.now()}.${file.name.split('.').pop()}`;
      let storagePath: string;

      if (this.isExample) {
        const exampleId = this.examplesService.getCurrentExampleId();
        storagePath = `cv-app/examples/${exampleId}/gallery-videos/${videoName}`;
      } else {
        // Modo normal - solo guardar en rutas de usuario
        storagePath = `cv-app/users/${this.userEmailKey}/gallery-videos/${videoName}`;
      }

      const storageRef = ref(this.storage, storagePath);
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
        (error) => this.handleUploadError(error),
        async () => await this.handleUploadComplete(uploadTask)
      );
    });
  }

  // Maneja la finalización de la subida
  // Actualiza la galería de videos del usuario o del ejemplo según corresponda
  private async handleUploadComplete(uploadTask: any): Promise<void> {
    try {
      const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);

      if (this.isExample) {
        const exampleId = this.examplesService.getCurrentExampleId();
        const dbPath = `cv-app/examples/${exampleId}/gallery-videos`;
        await this.updateExampleGallery(downloadURL, dbPath);
      } else if (this.userEmailKey) {
        const dbPath = `cv-app/users/${this.userEmailKey}/gallery-videos`;
        await this.updateUserGallery(downloadURL, dbPath);
      }

      this.ngZone.run(() => {
        this.toast.show('Video subido exitosamente', 'success');
        this.uploadComplete.emit(downloadURL);
      });
    } catch (error) {
      this.handleUploadError(error);
    }
  }

  // Actualiza la galería de videos del usuario
  // Solo se usa en modo normal (no ejemplo)
  private async updateUserGallery(videoUrl: string, dbPath: string): Promise<void> {
    if (!this.userEmailKey) return;

    return runInInjectionContext(this.injector, async () => {
      try {
        const userData = await this.firebaseService.getUserData(this.userEmailKey!);
        const profileData = userData?.profileData || {};
        const multimediaData = profileData.multimedia || {};
        const currentVideos = Array.isArray(multimediaData.galleryVideos)
          ? multimediaData.galleryVideos
          : [];

        if (!currentVideos.includes(videoUrl)) {
          const updatedMultimedia = {
            ...multimediaData,
            galleryVideos: [...currentVideos, videoUrl]
          };

          await this.firebaseService.updateUserData(this.userEmailKey!, {
            profileData: {
              ...profileData,
              multimedia: updatedMultimedia
            }
          });
        }
      } catch (error) {
        console.error('Error al actualizar la galería de videos:', error);
        throw error;
      }
    });
  }

  // Actualiza la galería de videos de ejemplo
  // Solo se usa en modo ejemplo
  private async updateExampleGallery(videoUrl: string, dbPath: string): Promise<void> {
    return runInInjectionContext(this.injector, async () => {
      const exampleRef = dbRef(this.database, dbPath);

      try {
        const snapshot = await get(exampleRef);
        let currentVideos: string[] = snapshot.exists() ? snapshot.val() : [];

        if (!currentVideos.includes(videoUrl)) {
          currentVideos.push(videoUrl);
          await set(exampleRef, currentVideos);
        }
      } catch (error) {
        console.error('Error al actualizar la galería de ejemplo:', error);
        throw error;
      }
    });
  }

  // Manejo de errores de subida
  private handleUploadError(error: any): void {
    this.ngZone.run(() => {
      console.error('Upload error:', error);

      let message = 'Error desconocido al subir el video';

      if (error instanceof Error) {
        // Mensajes más amigables para errores comunes
        if (error.message.includes('permission-denied')) {
          message = 'No tienes permiso para realizar esta acción';
        } else if (error.message.includes('unauthenticated')) {
          message = 'Debes iniciar sesión para subir videos';
        } else if (error.message.includes('quota-exceeded')) {
          message = 'Has excedido el límite de almacenamiento';
        } else {
          message = error.message;
        }
      }

      this.toast.show(message, 'error');
    });
  }

  ngOnDestroy(): void {
    // Limpieza si es necesaria
  }
}