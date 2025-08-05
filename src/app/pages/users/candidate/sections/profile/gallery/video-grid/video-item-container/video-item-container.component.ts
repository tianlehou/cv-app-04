import { Component, Input, Output, EventEmitter, ViewChild, ElementRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-video-item-container',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './video-item-container.component.html',
  styleUrls: ['./video-item-container.component.css']
})
export class VideoItemContainerComponent {
  @Input() videoUrl: string = '';
  @Input() isExpanded: boolean = false;
  @Input() readOnly: boolean = false;
  @Output() toggleExpand = new EventEmitter<void>();
  @Output() deleteVideo = new EventEmitter<string>();
  
  @ViewChild('videoPlayer') videoPlayer!: ElementRef<HTMLVideoElement>;
  @ViewChild('videoContainer', { static: true }) videoContainer!: ElementRef<HTMLDivElement>;

  onToggleExpand(): void {
    this.toggleExpand.emit();
  }

  onDeleteVideo(event: Event): void {
    event.stopPropagation();
    this.deleteVideo.emit(this.videoUrl);
  }

  onVideoPlay(): void {
    // Pausar otros videos cuando uno se reproduce
    const videos = document.querySelectorAll('video');
    videos.forEach(video => {
      if (video !== this.videoPlayer.nativeElement) {
        video.pause();
      }
    });
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: MouseEvent): void {
    // Verificar si el clic fue fuera del contenedor del video
    if (this.isExpanded && !this.videoContainer.nativeElement.contains(event.target as Node)) {
      this.onToggleExpand();
    }
  }
}
