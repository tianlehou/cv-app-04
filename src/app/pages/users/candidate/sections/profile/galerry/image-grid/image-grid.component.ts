import {
  Component,
  OnInit,
  Input,
  OnDestroy,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { User } from '@angular/fire/auth';
import { ToastService } from 'src/app/shared/services/toast.service';
import { FirebaseService } from 'src/app/shared/services/firebase.service';
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
  @Input() currentUser: User | null = null;
  @Input() readOnly: boolean = false;
  @Input() isExample: boolean = false;
  userEmailKey: string | null = null;
  userImages: string[] = [];

  constructor(
    private firebaseService: FirebaseService,
    private toast: ToastService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    if (this.currentUser?.email) {
      this.userEmailKey = this.formatEmailKey(this.currentUser.email);
      this.loadUserImages();
    }
  }

  ngOnDestroy(): void { }

  public async handleUploadComplete(imageUrl: string): Promise<void> {
    if (this.readOnly) return; // No permitir uploads en modo lectura
    
    await this.updateUserImages(imageUrl);
    this.loadUserImages(imageUrl);
  }

  public onImageDeleted(deletedImageUrl: string): void {
    if (this.readOnly) return; // No permitir borrados en modo lectura
    
    this.userImages = this.userImages.filter((img) => img !== deletedImageUrl);
    this.cdr.detectChanges();
  }

  private formatEmailKey(email: string): string {
    return email.replace(/\./g, '_');
  }

  private async loadUserImages(addedImageUrl?: string): Promise<void> {
    if (!this.userEmailKey) return;

    try {
      const userData = await this.firebaseService.getUserData(this.userEmailKey);
      const multimediaData = userData?.profileData?.multimedia || {};
      let images = multimediaData.galleryImages || [];

      if (addedImageUrl && !images.includes(addedImageUrl)) {
        images = [...images, addedImageUrl];
      }

      this.userImages = this.sortImagesByDate(images);
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