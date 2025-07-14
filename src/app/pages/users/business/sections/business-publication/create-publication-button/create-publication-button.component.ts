// video-upload-button.component.ts
import { CommonModule } from '@angular/common';
import { Component, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-create-publication-button',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './create-publication-button.component.html',
  styleUrls: ['./create-publication-button.component.css'],
})
export class CreatePublicationButtonComponent {
  @Output() createClick = new EventEmitter<void>();

  onCreateClick(): void {
    this.createClick.emit();
  }
}