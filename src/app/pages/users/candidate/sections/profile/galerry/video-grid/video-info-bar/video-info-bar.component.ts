import { Component, Input, Output, EventEmitter, OnChanges } from '@angular/core';
import { inject, runInInjectionContext, EnvironmentInjector } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Storage, ref, getMetadata } from '@angular/fire/storage';

@Component({
  selector: 'app-video-info-bar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './video-info-bar.component.html',
  styleUrls: ['./video-info-bar.component.css']
})
export class VideoInfoBarComponent implements OnChanges {
  @Input() videoUrls: string[] = [];
  @Output() totalSizeCalculated = new EventEmitter<number>();

  private storage = inject(Storage);
  private injector = inject(EnvironmentInjector);
  totalUploadedMB: number = 0;

  ngOnChanges() {
    if (this.videoUrls.length > 0) {
      this.calculateTotalSizeMB(this.videoUrls);
    } else {
      this.totalUploadedMB = 0;
      this.totalSizeCalculated.emit(0);
    }
  }

  private async calculateTotalSizeMB(videos: string[]): Promise<void> {
    try {
      const totalBytes = await runInInjectionContext(this.injector, async () => {
        return this.calculateTotalSize(videos);
      });
      this.totalUploadedMB = totalBytes / 1048576; // Convert to MB
      this.totalSizeCalculated.emit(this.totalUploadedMB);
    } catch (error) {
      console.error('Error calculating total size:', error);
      this.totalUploadedMB = 0;
      this.totalSizeCalculated.emit(0);
    }
  }

  private async calculateTotalSize(videos: string[]): Promise<number> {
    if (!videos || videos.length === 0) return 0;

    try {
      const sizes = await Promise.all(
        videos.map(async (url) => {
          return runInInjectionContext(this.injector, async () => {
            try {
              const videoRef = ref(this.storage, url);
              const metadata = await getMetadata(videoRef);
              return metadata.size || 0;
            } catch (error) {
              console.error('Error getting video metadata:', error);
              return 0;
            }
          });
        })
      );

      return sizes.reduce((sum, size) => sum + size, 0);
    } catch (error) {
      console.error('Error calculating total video size:', error);
      return 0;
    }
  }
}