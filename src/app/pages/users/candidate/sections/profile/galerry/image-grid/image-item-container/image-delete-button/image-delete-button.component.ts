import { Component, EventEmitter, Output, Input, inject, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConfirmationModalService } from 'src/app/shared/services/confirmation-modal.service';
import { Storage, ref, deleteObject } from '@angular/fire/storage';
import { FirebaseService } from 'src/app/shared/services/firebase.service';
import { ToastService } from 'src/app/shared/services/toast.service';
import { User } from '@angular/fire/auth';
import { EnvironmentInjector } from '@angular/core';
import { runInInjectionContext } from '@angular/core';

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
  @Output() imageDeleted = new EventEmitter<string>();
  
  private storage = inject(Storage);
  private firebaseService = inject(FirebaseService);
  private toast = inject(ToastService);
  private injector = inject(EnvironmentInjector);
  private ngZone = inject(NgZone);
  private confirmationModalService = inject(ConfirmationModalService);

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
    if (!this.userEmailKey || !this.currentUser?.email) return;
    
    try {
      await runInInjectionContext(this.injector, async () => {
        // Eliminar la imagen del Storage
        await deleteObject(ref(this.storage, this.imageUrl));
        
        // Actualizar los datos del usuario en la base de datos
        await this.removeImageFromUserData();
      });
      
      // Notificar que la imagen fue eliminada
      this.ngZone.run(() => {
        this.toast.show('Imagen eliminada exitosamente', 'success');
        this.imageDeleted.emit(this.imageUrl);
      });
    } catch (error) {
      this.ngZone.run(() => {
        console.error('Error deleting image:', error);
        this.toast.show('Error eliminando imagen', 'error');
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