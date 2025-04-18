// image-item-container.component.ts
import { CommonModule } from '@angular/common';
import { Component, Input, Output, EventEmitter, inject, NgZone } from '@angular/core';
import { Storage, ref, deleteObject } from '@angular/fire/storage';
import { ToastService } from '../../../../../../../../shared/services/toast.service';
import { FirebaseService } from '../../../../../../../../shared/services/firebase.service';
import { User } from '@angular/fire/auth';
import { EnvironmentInjector } from '@angular/core';
import { runInInjectionContext } from '@angular/core';
import { WatermarkComponent } from './watermark/watermark.component';
import { DeleteButtonComponent } from './delete-button/delete-button.component';

@Component({
  selector: 'app-image-item-container',
  standalone: true,
  imports: [CommonModule, WatermarkComponent, DeleteButtonComponent],
  templateUrl: './image-item-container.component.html',
  styleUrl: './image-item-container.component.css'
})
export class ImageItemContainerComponent {
  @Input() imageUrl: string = '';
  @Input() currentUser: User | null = null;
  @Input() userEmailKey: string | null = null;
  @Output() imageDeleted = new EventEmitter<string>();

  isLoading = false;

  private storage = inject(Storage);
  private firebaseService = inject(FirebaseService);
  private toast = inject(ToastService);
  private injector = inject(EnvironmentInjector);
  private ngZone = inject(NgZone);

  async handleDeleteConfirmed(imageUrl: string): Promise<void> {
    if (!this.userEmailKey || !this.currentUser?.email) return;

    this.isLoading = true;

    try {
      await runInInjectionContext(this.injector, async () => {
        await deleteObject(ref(this.storage, imageUrl));
        await this.removeImageFromUserData();
      });

      this.ngZone.run(() => {
        this.toast.show('Imagen eliminada exitosamente', 'success');
        this.imageDeleted.emit(imageUrl);
        this.isLoading = false;
      });
    } catch (error) {
      this.ngZone.run(() => {
        console.error('Error deleting image:', error);
        this.toast.show('Error eliminando imagen', 'error');
        this.isLoading = false;
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