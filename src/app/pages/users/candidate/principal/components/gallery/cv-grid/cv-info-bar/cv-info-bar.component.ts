import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-cv-info-bar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cv-info-bar.component.html',
  styleUrls: ['./cv-info-bar.component.css']
})
export class CvInfoBarComponent {
  @Output() canvasClicked = new EventEmitter<void>();
  @Output() atsClicked = new EventEmitter<void>();

  onCanvasClick() {
    this.canvasClicked.emit();
  }

  onAtsClick() {
    this.atsClicked.emit();
  }
}