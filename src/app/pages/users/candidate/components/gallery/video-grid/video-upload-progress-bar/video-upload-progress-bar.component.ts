// video-upload-progress-bar.component.ts
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FileSizePipe } from '../../../../../../../shared/pipes/filesize.pipe';

@Component({
  selector: 'app-video-upload-progress-bar',
  standalone: true,
  imports: [CommonModule, FileSizePipe],
  templateUrl: './video-upload-progress-bar.component.html',
  styleUrls: ['./video-upload-progress-bar.component.css']
})
export class VideoUploadProgressBarComponent {
  @Input() uploadProgress: number | null = null;
  @Input() uploadedSize: number = 0;
  @Input() totalSize: number = 0;
}