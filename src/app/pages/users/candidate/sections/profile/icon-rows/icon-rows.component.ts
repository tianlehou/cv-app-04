import { Component, EventEmitter, Input, Output } from '@angular/core';
import { GalleryView } from '../galerry/gallery.component';

@Component({
  selector: 'app-icon-rows',
  standalone: true,
  templateUrl: './icon-rows.component.html',
  styleUrls: ['./icon-rows.component.css']
})
export class IconRowsComponent {
  @Input() activeView: GalleryView | null = null;
  @Output() iconSelected = new EventEmitter<GalleryView>();

  selectIcon(iconType: GalleryView): void {
    this.iconSelected.emit(iconType);
  }
}