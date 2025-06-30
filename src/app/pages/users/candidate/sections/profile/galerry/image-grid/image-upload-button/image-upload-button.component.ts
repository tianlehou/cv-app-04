import { CommonModule } from '@angular/common';
import { Component, Output, EventEmitter, Input, inject, ChangeDetectorRef, NgZone, EnvironmentInjector, OnDestroy } from '@angular/core';
import { Storage, ref, uploadBytesResumable, getDownloadURL } from '@angular/fire/storage';
import { Database, ref as dbRef, set, get } from '@angular/fire/database';
import { ToastService } from 'src/app/shared/services/toast.service';
import { runInInjectionContext } from '@angular/core';
import { ImageCompressionService } from 'src/app/shared/services/image-compression.service';
import { FirebaseService } from 'src/app/shared/services/firebase.service';

@Component({
  selector: 'app-image-upload-button',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './image-upload-button.component.html',
  styleUrls: ['./image-upload-button.component.css'],
})
export class ImageUploadButtonComponent implements OnDestroy {
  @Input() userEmailKey: string | null = null;
  @Input() isExample: boolean = false;
  @Input() isEditor: boolean = false;
  @Input() readOnly: boolean = false;
  @Output() uploadComplete = new EventEmitter<string>();

  // Propiedades de estado
  selectedFile: File | null = null;
  currentSnapshot: any = null;
  showProgress = false;

  private injector = inject(EnvironmentInjector);
  private storage = inject(Storage);
  private firebaseService = inject(FirebaseService);
  private toast = inject(ToastService);
  private cdr = inject(ChangeDetectorRef);
  private ngZone = inject(NgZone);
  private imageCompression = inject(ImageCompressionService);

  async onFileSelected(event: Event): Promise<void> {
    // Permitir siempre la subida para pruebas
    console.log('Subiendo archivo...');

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
    } finally {
      // Limpiar el input de archivo para permitir cargar el mismo archivo nuevamente
      input.value = '';
    }
  }

  private async uploadImage(): Promise<void> {
    if (!this.selectedFile) return;

    this.showProgress = true;
    this.currentSnapshot = null;

    try {
      await runInInjectionContext(this.injector, async () => {
        const imageName = `gallery-image-${Date.now()}.${this.selectedFile!.name.split('.').pop()}`;
        
        // Usar ruta diferente para modo ejemplo
        let storagePath: string;
        if (this.isExample) {
          storagePath = `cv-app/examples/gallery-images/${imageName}`;
        } else {
          if (!this.userEmailKey) return;
          storagePath = `cv-app/users/${this.userEmailKey}/gallery-images/${imageName}`;
        }
        
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

    await runInInjectionContext(this.injector, async () => {
      try {
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
        
        if (this.isExample) {
          await this.updateExampleGallery(downloadURL);
        } else if (this.userEmailKey) {
          await this.updateUserGallery(downloadURL);
        }
        
        this.ngZone.run(() => {
          this.toast.show('Imagen subida exitosamente', 'success');
          this.uploadComplete.emit(downloadURL);
          this.resetUploadState();
        });
      } catch (error) {
        this.handleUploadError(error);
      }
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

  private async updateExampleGallery(imageUrl: string): Promise<void> {
    return runInInjectionContext(this.injector, async () => {
      const examplePath = 'cv-app/examples/gallery-images';
      const database = inject(Database);
      const exampleRef = dbRef(database, examplePath);
      const toast = inject(ToastService);
      const ngZone = inject(NgZone);
      
      try {
        // Obtener el array actual de imágenes
        const snapshot = await get(exampleRef);
        let currentImages: string[] = [];
        
        if (snapshot.exists()) {
          const data = snapshot.val();
          // Si es un array, usarlo directamente, si no, crear un array con el valor
          currentImages = Array.isArray(data) ? [...data] : [];
        }
        
        // Verificar si la imagen ya existe para evitar duplicados
        if (!currentImages.includes(imageUrl)) {
          // Agregar la nueva imagen al array
          currentImages.push(imageUrl);
          
          // Actualizar en Firebase
          await set(exampleRef, currentImages);
        } else {
          console.log('La imagen ya existe en la galería de ejemplo');
          ngZone.run(() => {
            toast.show('La imagen ya existe en la galería de ejemplo', 'info');
          });
        }
      } catch (error) {
        console.error('Error al actualizar la galería de ejemplo:', error);
        throw error;
      }
    });
  }

  private async updateUserGallery(imageUrl: string): Promise<void> {
    const userEmailKey = this.userEmailKey;
    if (!userEmailKey) return;
    
    return runInInjectionContext(this.injector, async () => {
      try {
        const userData = await this.firebaseService.getUserData(userEmailKey);
        const profileData = userData?.profileData || {};
        const multimediaData = profileData.multimedia || {};
        const currentGalleryImages = Array.isArray(multimediaData.galleryImages) 
          ? multimediaData.galleryImages 
          : [];
        
        if (!currentGalleryImages.includes(imageUrl)) {
          const updatedMultimedia = {
            ...multimediaData,
            galleryImages: [...currentGalleryImages, imageUrl]
          };
          
          await this.firebaseService.updateUserData(userEmailKey, {
            profileData: {
              ...profileData,
              multimedia: updatedMultimedia
            }
          });
        } else {
          this.ngZone.run(() => {
            this.toast.show('La imagen ya existe en tu galería', 'info');
          });
        }
      } catch (error) {
        console.error('Error al actualizar la galería del usuario:', error);
        throw error;
      }
    });
  }

  ngOnDestroy(): void {
    // Limpieza si es necesaria
  }
}