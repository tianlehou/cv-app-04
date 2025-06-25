import { Component, Input, ChangeDetectorRef, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
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

  private formatEmailKey(email: string): string {
    return email.replace(/\./g, '_');
  }

  public handleUploadComplete(imageUrl: string): void {
    if (this.readOnly) return;

    // Actualizar la lista local con la nueva imagen
    if (!this.userImages.includes(imageUrl)) {
      this.userImages = this.sortImagesByDate([...this.userImages, imageUrl]);
      this.cdr.detectChanges();
    }
  }

  public handleImageDeleted(deletedImageUrl: string): void {
    // Actualizar la lista local eliminando la imagen
    this.userImages = this.userImages.filter(img => img !== deletedImageUrl);
    this.cdr.detectChanges();
  }

  private async loadUserImages(): Promise<void> {
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
      } else if (this.userEmailKey) {
        // Modo normal: cargar imágenes del usuario
        const userData = await this.firebaseService.getUserData(this.userEmailKey);
        const multimediaData = userData?.profileData?.multimedia || {};
        const images = multimediaData.galleryImages || [];
        this.userImages = this.sortImagesByDate(images);
      }
      this.cdr.detectChanges();
    } catch (error) {
      console.error('Error cargando imágenes:', error);
      this.toast.show('Error cargando imágenes', 'error');
    }
  }

  private sortImagesByDate(images: string[]): string[] {
    return [...images].sort((a, b) => {
      const getTimestamp = (url: string) => {
        const filename = url.split('%2F').pop()?.split('?')[0] || '';
        const timestampMatch = filename.match(/-\d+\./);
        return timestampMatch ? parseInt(timestampMatch[0].replace(/[^\d]/g, ''), 10) : 0;
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
}