import { Component, EventEmitter, Output, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-cv-info-bar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cv-info-bar.component.html',
  styleUrls: ['./cv-info-bar.component.css']
})
export class CvInfoBarComponent {
  @Input() activeButton: 'canvas' | 'ats' | null = null;
  @Input() disabled = false;
  @Output() canvasClicked = new EventEmitter<void>();
  @Output() atsClicked = new EventEmitter<void>();

  onCanvasClick() {
    if (!this.disabled) {
      this.canvasClicked.emit();
    }
  }

  onAtsClick() {
    if (!this.disabled) {
      this.atsClicked.emit();
    }
  }
}