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
    if (this.isExample) {
      this.loadUserImages();
    } else if (this.currentUser?.email) {
      console.log('Cargando en modo usuario normal');
      this.userEmailKey = this.formatEmailKey(this.currentUser.email);
      this.loadUserImages();
      // Solo verificar el estado de editor si no se proporcionó como input
      if (this.isEditor === undefined) {
        this.checkEditorStatus();
      }
    } else {
      console.warn('No se pudo inicializar: No hay usuario actual y no está en modo ejemplo');
    }
  }

  ngOnDestroy(): void { }

  private formatEmailKey(email: string): string {
    return email.replace(/\./g, '_');
  }

  public handleUploadComplete(imageUrl: string): void {
    if (this.readOnly) {
      return;
    }

    // Actualizar la lista local con la nueva imagen
    if (!this.userImages.includes(imageUrl)) {
      this.userImages = this.sortImagesByDate([...this.userImages, imageUrl]);
      this.cdr.detectChanges();
    } else {
      console.log('La imagen ya existe en la galería');
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
        const examplePath = 'cv-app/example/gallery-images';
        const exampleRef = ref(this.database, examplePath);
        const snapshot = await get(exampleRef);

        if (snapshot.exists()) {
          const exampleImages = snapshot.val();

          // Verificar si es un array, si no, convertirlo en un array
          const imagesArray = Array.isArray(exampleImages)
            ? exampleImages
            : (exampleImages ? [exampleImages] : []);

          this.userImages = this.sortImagesByDate(imagesArray);
        } else {
          console.warn('No se encontraron imágenes de ejemplo en la ruta:', examplePath);
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
    if (!Array.isArray(images) || images.length === 0) {
      console.log('No hay imágenes para ordenar');
      return [];
    }

    try {
      const sorted = [...images].sort((a, b) => {
        const getTimestamp = (url: string): number => {
          if (!url || typeof url !== 'string') {
            console.warn('URL inválida:', url);
            return 0;
          }

          // Extraer el nombre del archivo de la URL
          let filename = '';
          try {
            // Intentar decodificar la URL en caso de que esté codificada
            const decodedUrl = decodeURIComponent(url);
            filename = decodedUrl.split('/').pop() || '';
            // Eliminar parámetros de consulta si existen
            filename = filename.split('?')[0];
          } catch (e) {
            console.warn('Error al decodificar URL:', url, e);
            filename = url.split('/').pop() || '';
            filename = filename.split('?')[0];
          }

          // Buscar timestamp en el formato -1234567890.ext
          const timestampMatch = filename.match(/-\d+(?=\.\w+$)/);
          if (timestampMatch) {
            const timestamp = parseInt(timestampMatch[0].substring(1), 10);
            return timestamp;
          }

          console.warn('No se encontró timestamp en:', filename);
          return 0;
        };

        return getTimestamp(b) - getTimestamp(a);
      });

      return sorted;
    } catch (error) {
      console.error('Error al ordenar imágenes:', error);
      return [...images]; // Devolver las imágenes sin ordenar en caso de error
    }
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