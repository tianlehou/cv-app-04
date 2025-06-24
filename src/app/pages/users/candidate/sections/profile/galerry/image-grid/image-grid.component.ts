import { Component, Input, ChangeDetectorRef, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { User } from '@angular/fire/auth';
import { Database, ref, get, set } from '@angular/fire/database';
import { FirebaseService } from 'src/app/shared/services/firebase.service';
import { ToastService } from 'src/app/shared/services/toast.service';
import { ImageInfoBarComponent } from './image-info-bar/image-info-bar.component';
import { ImageUploadButtonComponent } from './image-upload-button/image-upload-button.component';
import { ImageItemContainerComponent } from './image-item-container/image-item-container.component';
import { ImageEmptyGalleryMessageComponent } from './image-empty-gallery-message/image-empty-gallery-message.component';

@Component({
  selector: 'app-image-grid',
  standalone: true,
  imports: [
    CommonModule,
    ImageInfoBarComponent,
    ImageUploadButtonComponent,
    ImageItemContainerComponent,
    ImageEmptyGalleryMessageComponent
  ],
  templateUrl: './image-grid.component.html',
  styleUrls: ['./image-grid.component.css'],
})
export class ImageGridComponent implements OnInit, OnDestroy {
  @Input() currentUser: any = null;
  @Input() isEditor: boolean = false;
  @Input() readOnly: boolean = false;
  @Input() isExample: boolean = false;
  userEmailKey: string | null = null;
  userImages: string[] = [];

  constructor(
    private firebaseService: FirebaseService,
    private toast: ToastService,
    private cdr: ChangeDetectorRef,
    private database: Database
  ) { }

  ngOnInit(): void {
    if (this.currentUser?.email) {
      this.userEmailKey = this.formatEmailKey(this.currentUser.email);
      this.loadUserImages();
      // Solo verificar el estado de editor si no se proporcionó como input
      if (this.isEditor === undefined) {
        this.checkEditorStatus();
      }
    }
  }

  ngOnDestroy(): void { }

  public async handleUploadComplete(imageUrl: string): Promise<void> {
    if (this.readOnly) return;

    try {
      if (this.isExample) {
        // En modo ejemplo, actualizar en 'cv-app/example'
        const examplePath = 'cv-app/example';
        const exampleRef = ref(this.database, examplePath);
        
        // Obtener datos actuales
        const snapshot = await get(exampleRef);
        const currentData = snapshot.exists() ? snapshot.val() : {};
        const currentGalleryImages = Array.isArray(currentData.galleryImages) 
          ? currentData.galleryImages 
          : [];
        
        // Verificar si la imagen ya existe para evitar duplicados
        if (!currentGalleryImages.includes(imageUrl)) {
          // Actualizar en Firebase
          await set(exampleRef, {
            ...currentData,
            galleryImages: [...currentGalleryImages, imageUrl]
          });
          
          // Actualizar la lista local
          this.userImages = this.sortImagesByDate([...currentGalleryImages, imageUrl]);
          this.toast.show('Imagen de ejemplo guardada', 'info');
        } else {
          this.toast.show('La imagen ya existe en la galería', 'info');
        }
      } else {
        // Modo normal: actualizar la lista local
        await this.updateUserImages(imageUrl);
        this.userImages = this.sortImagesByDate([...this.userImages, imageUrl]);
      }
      this.cdr.detectChanges();
    } catch (error) {
      console.error('Error al guardar la imagen:', error);
      this.toast.show('Error al guardar la imagen', 'error');
    }
  }

  public async onImageDeleted(deletedImageUrl: string): Promise<void> {
    if (this.readOnly) return; // No permitir borrados en modo lectura
    
    try {
      if (this.isExample) {
        // En modo ejemplo, actualizar en 'cv-app/example'
        const examplePath = 'cv-app/example';
        const exampleRef = ref(this.database, examplePath);
        
        // Obtener datos actuales
        const snapshot = await get(exampleRef);
        const currentData = snapshot.exists() ? snapshot.val() : {};
        const currentGalleryImages = Array.isArray(currentData.galleryImages) 
          ? currentData.galleryImages 
          : [];
        
        // Filtrar la imagen eliminada
        const updatedGallery = currentGalleryImages.filter((img: string) => img !== deletedImageUrl);
        
        // Actualizar en Firebase
        await set(exampleRef, {
          ...currentData,
          galleryImages: updatedGallery
        });
        
        // Actualizar la lista local
        this.userImages = updatedGallery;
        this.toast.show('Imagen de ejemplo eliminada', 'info');
      } else {
        // Modo normal: actualizar la lista local
        this.userImages = this.userImages.filter((img) => img !== deletedImageUrl);
      }
      this.cdr.detectChanges();
    } catch (error) {
      console.error('Error al eliminar la imagen:', error);
      this.toast.show('Error al eliminar la imagen', 'error');
    }
  }

  private formatEmailKey(email: string): string {
    return email.replace(/\./g, '_');
  }

  private getExampleUserKey(): string {
    return 'example_user';
  }

  private async loadUserImages(addedImageUrl?: string): Promise<void> {
    try {
      if (this.isExample) {
        // En modo ejemplo, cargar desde la ruta de ejemplo
        const examplePath = 'cv-app/example';
        const exampleRef = ref(this.database, examplePath);
        const snapshot = await get(exampleRef);
        
        if (snapshot.exists()) {
          const exampleData = snapshot.val();
          const exampleImages = Array.isArray(exampleData?.galleryImages) 
            ? exampleData.galleryImages 
            : [];
          this.userImages = this.sortImagesByDate(exampleImages);
        } else {
          this.userImages = [];
        }
        
        // Si se está agregando una nueva imagen, actualizar la lista local
        if (addedImageUrl && !this.userImages.includes(addedImageUrl)) {
          this.userImages = this.sortImagesByDate([...this.userImages, addedImageUrl]);
        }
      } else if (this.userEmailKey) {
        // Modo normal: cargar imágenes del usuario
        const userData = await this.firebaseService.getUserData(this.userEmailKey);
        const multimediaData = userData?.profileData?.multimedia || {};
        let images = multimediaData.galleryImages || [];

        if (addedImageUrl && !images.includes(addedImageUrl)) {
          images = [...images, addedImageUrl];
        }

        this.userImages = this.sortImagesByDate(images);
      }
      this.cdr.detectChanges();
    } catch (error) {
      console.error('Error loading images:', error);
      this.toast.show('Error cargando imágenes', 'error');
    }
  }

  private sortImagesByDate(images: string[]): string[] {
    return images.sort((a, b) => {
      const getTimestamp = (url: string) => {
        const filename = url.split('%2F').pop()?.split('?')[0] || '';
        const timestampMatch = filename.match(/-(\d+)\./);
        return timestampMatch ? parseInt(timestampMatch[1], 10) : 0;
      };
      return getTimestamp(b) - getTimestamp(a);
    });
  }

  private async checkEditorStatus(): Promise<void> {
    if (!this.userEmailKey) return;
    
    try {
      const userData = await this.firebaseService.getUserData(this.userEmailKey);
      this.isEditor = userData?.isEditor === true;
      this.cdr.detectChanges();
    } catch (error) {
      console.error('Error checking editor status:', error);
      this.isEditor = false;
    }
  }

  private async updateUserImages(imageUrl: string): Promise<void> {
    if (!this.userEmailKey || !this.currentUser?.email || this.readOnly) return;

    try {
      const currentData = await this.firebaseService.getUserData(this.userEmailKey);

      const currentMultimedia = currentData?.profileData?.multimedia || {};
      const currentGalleryImages = currentMultimedia.galleryImages || [];

      const updatedData = {
        profileData: {
          ...(currentData?.profileData || {}),
          multimedia: {
            ...currentMultimedia,
            galleryImages: [...currentGalleryImages, imageUrl]
          }
        }
      };

      await this.firebaseService.updateUserData(
        this.currentUser.email,
        updatedData
      );
    } catch (error) {
      console.error('Error updating user images:', error);
      this.toast.show('Error al actualizar las imágenes', 'error');
    }
  }
}