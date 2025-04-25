import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-video-info-bar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './video-info-bar.component.html',
  styleUrl: './video-info-bar.component.css'
})
export class VideoInfoBarComponent {
  @Input() totalUploadedMB: number = 0;
}