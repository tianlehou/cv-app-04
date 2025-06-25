import { Component, EventEmitter, Output, Input, inject, NgZone } from '@angular/core';
import { EnvironmentInjector, runInInjectionContext } from '@angular/core';
import { CommonModule } from '@angular/common';
import { User } from '@angular/fire/auth';
import { Storage, ref, deleteObject } from '@angular/fire/storage';
import { Database, ref as dbRef, get, set } from '@angular/fire/database';
import { FirebaseService } from 'src/app/shared/services/firebase.service';
import { ConfirmationModalService } from 'src/app/shared/services/confirmation-modal.service';
import { ToastService } from 'src/app/shared/services/toast.service';

@Component({
  selector: 'app-image-delete-button',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button class="delete-button" (click)="showDeleteModal()">
      <i class="fas fa-trash"></i>
    </button>
  `,
  styles: [`
    .delete-button {
      position: absolute;
      top: 8px;
      right: 8px;
      background: var(--clr-red);
      color: white;
      border: none;
      border-radius: 50%;
      width: 30px;
      height: 30px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      opacity: 0;
      transition: opacity 0.3s ease;
      z-index: 3;
    }

    :host-context(.image-item:hover) .delete-button {
      opacity: 1;
    }
  `]
})
export class ImageDeleteButtonComponent {
  @Input() imageUrl: string = '';
  @Input() currentUser: User | null = null;
  @Input() userEmailKey: string | null = null;
  @Input() isExample: boolean = false;
  @Input() readOnly: boolean = false;
  @Output() imageDeleted = new EventEmitter<string>();

  private storage = inject(Storage);
  private firebaseService = inject(FirebaseService);
  private toast = inject(ToastService);
  private injector = inject(EnvironmentInjector);
  private ngZone = inject(NgZone);
  private confirmationModalService = inject(ConfirmationModalService);
  private database = inject(Database);

  showDeleteModal(): void {
    if (!this.imageUrl) return;

    this.confirmationModalService.show(
      {
        title: 'Eliminar Imagen',
        message: '¿Estás seguro de que deseas eliminar esta imagen?'
      },
      () => this.deleteImage()
    );
  }

  private async deleteImage(): Promise<void> {
    if (this.readOnly) return;

    try {
      await runInInjectionContext(this.injector, async () => {
        // 1. Primero, eliminar de la base de datos
        if (this.isExample) {
          // En modo ejemplo, actualizar en 'cv-app/example/gallery-images'
          const examplePath = 'cv-app/example/gallery-images';
          const exampleRef = dbRef(this.database, examplePath);

          // Obtener datos actuales
          const snapshot = await get(exampleRef);
          let currentGalleryImages: string[] = [];
          
          if (snapshot.exists()) {
            const data = snapshot.val();
            currentGalleryImages = Array.isArray(data) ? data : [];
          }

          // Filtrar la imagen eliminada
          const updatedGallery = currentGalleryImages.filter((img: string) => img !== this.imageUrl);

          // Actualizar en Firebase
          await set(exampleRef, updatedGallery);
        } else {
          // Modo normal: actualizar los datos del usuario
          await this.removeImageFromUserData();
        }

        // 2. Luego, eliminar del Storage
        try {
          await deleteObject(ref(this.storage, this.imageUrl));
        } catch (storageError) {
          console.warn('No se pudo eliminar del Storage, pero se actualizó la base de datos:', storageError);
        }

        // 3. Notificar que la imagen fue eliminada
        this.ngZone.run(() => {
          const message = this.isExample 
            ? 'Imagen de ejemplo eliminada' 
            : 'Imagen eliminada exitosamente';
          this.toast.show(message, 'success');
          this.imageDeleted.emit(this.imageUrl);
        });
      });
    } catch (error) {
      this.ngZone.run(() => {
        console.error('Error eliminando imagen:', error);
        this.toast.show('Error eliminando imagen: ' + (error as Error).message, 'error');
      });
    }
  }

  private async removeImageFromUserData(): Promise<void> {
    if (!this.userEmailKey || !this.currentUser?.email) return;

    const userData = await this.firebaseService.getUserData(this.userEmailKey);
    const updatedImages = (
      userData?.profileData?.multimedia?.galleryImages || []
    ).filter((img: string) => img !== this.imageUrl);

    const updatedData = {
      profileData: {
        ...(userData?.profileData || {}),
        multimedia: {
          ...(userData?.profileData?.multimedia || {}),
          galleryImages: updatedImages,
        },
      },
    };

    await this.firebaseService.updateUserData(this.currentUser.email, updatedData);
  }
}