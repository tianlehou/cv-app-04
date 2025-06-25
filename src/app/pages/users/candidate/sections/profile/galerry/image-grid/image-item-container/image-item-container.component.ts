// image-item-container.component.ts
import { CommonModule } from '@angular/common';
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { User } from '@angular/fire/auth';
import { WatermarkComponent } from './watermark/watermark.component';
import { ImageDeleteButtonComponent } from './image-delete-button/image-delete-button.component';

@Component({
  selector: 'app-image-item-container',
  standalone: true,
  imports: [CommonModule, WatermarkComponent, ImageDeleteButtonComponent],
  templateUrl: './image-item-container.component.html',
  styleUrls: ['./image-item-container.component.css']
})
export class ImageItemContainerComponent {
  @Input() imageUrl: string = '';
  @Input() currentUser: User | null = null;
  @Input() userEmailKey: string | null = null;
  @Output() imageDeleted = new EventEmitter<string>();
  @Input() isOwner: boolean = false;
  @Input() isExample: boolean = false;

  // Estados para el manejo de carga de imágenes
  imageLoaded: boolean = false;
  imageError: boolean = false;

  constructor() {
  }

  // Se ejecuta cuando la imagen se carga correctamente
  onImageLoad(): void {
    this.imageLoaded = true;
    this.imageError = false;
  }

  // Se ejecuta cuando hay un error al cargar la imagen
  onImageError(): void {
    console.error('Error al cargar la imagen:', this.imageUrl);
    this.imageError = true;
    this.imageLoaded = false;
  }

  onImageDeleted(imageUrl: string): void {
    this.imageDeleted.emit(imageUrl);
  }
}