import { Component, Input, ChangeDetectorRef, OnInit, OnDestroy } from '@angular/core';
import { inject, EnvironmentInjector, NgZone, runInInjectionContext } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { filter, distinctUntilChanged } from 'rxjs/operators';
import { Database, ref, get, onValue } from '@angular/fire/database';
import { FirebaseService } from 'src/app/shared/services/firebase.service';
import { ToastService } from 'src/app/shared/components/toast/toast.service';
import { ExamplesService } from 'src/app/shared/services/examples.service';
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
  private unsubscribeExample?: () => void;
  private currentExampleSubscription?: Subscription;

  private injector = inject(EnvironmentInjector);
  private database = inject(Database);
  private firebaseService = inject(FirebaseService);
  private toast = inject(ToastService);
  private cdr = inject(ChangeDetectorRef);
  private ngZone = inject(NgZone);
  private examplesService = inject(ExamplesService);

  constructor() {}

  ngOnInit(): void {
    if (this.isExample) {
      this.currentExampleSubscription = this.examplesService.currentExampleId$
        .pipe(
          filter(exampleId => !!exampleId),
          distinctUntilChanged()
        )
        .subscribe(exampleId => {
          this.loadExampleImages(exampleId);
        });
    } else if (this.currentUser?.email) {
      this.userEmailKey = this.firebaseService.formatEmailKey(this.currentUser.email);
      this.loadUserImages();
    } else {
      console.warn('No se pudo inicializar: No hay usuario actual y no está en modo ejemplo');
    }
  }

  ngOnDestroy(): void {
    if (this.unsubscribeExample) this.unsubscribeExample();
    if (this.currentExampleSubscription) this.currentExampleSubscription.unsubscribe();
  }

  public handleUploadComplete(imageUrl: string): void {
    if (this.readOnly && !this.isEditor) {
      return;
    }

    // Actualizar la lista local con la nueva imagen (se agrega al inicio para mantener el orden más reciente primero)
    if (!this.userImages.includes(imageUrl)) {
      this.userImages = [imageUrl, ...this.userImages];
      this.cdr.detectChanges();
    }
  }

  public handleImageDeleted(deletedImageUrl: string): void {
    // En modo ejemplo, no necesitamos hacer nada aquí ya que la actualización
    // en tiempo real manejará los cambios automáticamente
    if (!this.isExample) {
      // Solo en modo normal actualizamos manualmente la lista local
      this.userImages = this.userImages.filter(img => img !== deletedImageUrl);
      this.cdr.detectChanges();
    }
  }

  private loadExampleImages(exampleId: string): void {    
    runInInjectionContext(this.injector, () => {
      const examplePath = this.examplesService.getExampleImagesPath(exampleId);
      const exampleRef = ref(this.database, examplePath);
      
      // Cargar datos iniciales
      get(exampleRef).then(snapshot => {
        this.processExampleSnapshot(snapshot);
      }).catch(error => {
        console.error('Error cargando imágenes de ejemplo:', {
          error,
          exampleId,
          path: examplePath,
          timestamp: new Date().toISOString()
        });
        this.ngZone.run(() => {
          this.toast.show('Error cargando imágenes de ejemplo', 'error');
        });
      });
      
      // Configurar escucha de cambios en tiempo real
      this.unsubscribeExample = onValue(exampleRef, 
        (snapshot) => {
          this.processExampleSnapshot(snapshot);
        },
        (error) => {
          console.error('Error en tiempo real (ejemplo):', {
            error,
            exampleId,
            timestamp: new Date().toISOString()
          });
        }
      );
    });
  }

  private processExampleSnapshot(snapshot: any): void {
    this.ngZone.run(() => {
      if (snapshot.exists()) {
        const exampleImages = snapshot.val();
        const imagesArray = Array.isArray(exampleImages)
          ? exampleImages
          : (exampleImages ? [exampleImages] : []);
        
        this.userImages = [...imagesArray].reverse();
      } else {
        console.warn('No se encontraron imágenes de ejemplo');
        this.userImages = [];
      }
      this.cdr.detectChanges();
    });
  }

  private async loadUserImages(): Promise<void> {
    if (!this.userEmailKey) return;
    
    try {
      const userData = await this.firebaseService.getUserData(this.userEmailKey);
      const multimediaData = userData?.profileData?.multimedia || {};
      const images = multimediaData.galleryImages || [];
      this.userImages = [...images].reverse();
      this.cdr.detectChanges();
    } catch (error) {
      console.error('Error cargando imágenes del usuario:', error);
      this.ngZone.run(() => {
        this.toast.show('Error cargando tus imágenes', 'error');
      });
    }
  }
}