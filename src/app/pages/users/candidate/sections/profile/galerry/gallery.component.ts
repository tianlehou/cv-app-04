import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { User } from '@angular/fire/auth';
import { IconRowsComponent } from '../icon-rows/icon-rows.component';
import { ImageGridComponent } from './image-grid/image-grid.component';
import { VideoGridComponent } from './video-grid/video-grid.component';
import { CvGridComponent } from './cv-grid/cv-grid.component';

export type GalleryView = 'image' | 'video' | 'cv';

@Component({
  selector: 'app-gallery',
  standalone: true,
  imports: [
    CommonModule,
    IconRowsComponent,
    ImageGridComponent,
    VideoGridComponent,
    CvGridComponent,
  ],
  templateUrl: './gallery.component.html',
  styleUrls: ['./gallery.component.css'],
})
export class GalleryComponent implements OnInit {
  @Input() currentUser: User | null = null;
  @Input() readOnly: boolean = false;
  @Input() isOwner: boolean = false;
  @Input() isExample: boolean = false;
  @Input() isEditor: boolean = false;
  userEmail: string | null = null;

  ngOnInit(): void {
    if (this.isExample) {
      // En modo ejemplo, mostrar todo sin restricciones
      this.readOnly = true;
    } else if (this.currentUser && !this.readOnly) {
      this.userEmail = this.currentUser.email?.replaceAll('.', '_') || null;
    }
  }

  activeView: GalleryView = 'image'; // Vista por defecto

  // Método corregido y tipado
  onIconSelected(iconType: GalleryView): void {
    this.activeView = iconType;
  }
}
