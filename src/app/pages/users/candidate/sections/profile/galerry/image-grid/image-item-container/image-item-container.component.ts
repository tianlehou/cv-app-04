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

  onImageDeleted(imageUrl: string): void {
    this.imageDeleted.emit(imageUrl);
  }
}