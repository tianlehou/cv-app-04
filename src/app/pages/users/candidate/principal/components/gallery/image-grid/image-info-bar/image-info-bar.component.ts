import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InfoModalComponent } from './info-modal/info-modal.component';

@Component({
  selector: 'app-image-info-bar',
  standalone: true,
  imports: [CommonModule, InfoModalComponent],
  templateUrl: './image-info-bar.component.html',
  styleUrls: ['./image-info-bar.component.css']
})
export class ImageInfoBarComponent {
  @Input() isLoading = false;
  @Input() userImages: string[] = [];
  isInfoModalVisible = false;

  showInfoModal(): void {
    this.isInfoModalVisible = true;
  }

  hideInfoModal(): void {
    this.isInfoModalVisible = false;
  }

  getImageCountText(): string {
    if (this.userImages.length === 0) return 'No hay imágenes cargadas.';
    return `(${this.userImages.length}) foto${this.userImages.length > 1 ? 's' : ''} cargado${this.userImages.length > 1 ? 's' : ''}`;
  }
}