// video-grid.component.ts
import {
  Component,
  Input,
  OnInit,
  ChangeDetectorRef,
  NgZone,
  ViewChildren,
  QueryList,
  ElementRef,
  AfterViewInit,
  inject,
} from '@angular/core';
import { User } from '@angular/fire/auth';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../../../../../shared/services/toast.service';
import { FirebaseService } from '../../../../../../shared/services/firebase.service';
import { ConfirmationModalService } from '../../../../../../shared/services/confirmation-modal.service';
import {
  formatEmailKey,
  sortVideosByDate,
  initExpandedStates,
  validateCurrentUser,
  trackByVideoUrl,
  setupVideoPlayers,
  onVideoPlay,
  handleError,
  calculateTotalSize,
  updateState,
  updateUserVideos,
} from './video.utils';
import { VideoGridState } from './video-grid.types';
import { VideoService } from './video.service';
import { VideoInfoBarComponent } from './video-info-bar/video-info-bar.component';
import { VideoUploadButtonComponent } from './video-upload-button/video-upload-button.component';
import { VideoUploadProgressBarComponent } from './video-upload-progress-bar/video-upload-progress-bar.component';
import { VideoEmptyGalleryMessageComponent } from './video-empty-gallery-message/video-empty-gallery-message.component';

@Component({
  selector: 'app-video-grid',
  standalone: true,
  imports: [
    CommonModule,
    VideoInfoBarComponent,
    VideoUploadButtonComponent,
    VideoUploadProgressBarComponent,
    VideoEmptyGalleryMessageComponent
  ],
  templateUrl: './video-grid.component.html',
  styleUrls: ['./video-grid.component.css'],
})
export class VideoGridComponent implements OnInit, AfterViewInit {
  @ViewChildren('videoPlayer') videoPlayers!: QueryList<
    ElementRef<HTMLVideoElement>
  >;
  @Input() currentUser: User | null = null;
  @Input() readOnly: boolean = false;

  state: VideoGridState = {
    userVideos: [],
    isLoading: false,
    expandedStates: {},
    totalUploadedMB: 0,
    uploadProgress: null,
    uploadedSize: 0,
    totalSize: 0,
  };

  get userEmailKey(): string | null {
    return this.currentUser?.email
      ? formatEmailKey(this.currentUser.email)
      : null;
  }

  private videoService = inject(VideoService);
  private toast = inject(ToastService);
  private confirmationModal = inject(ConfirmationModalService);
  private firebaseService = inject(FirebaseService);
  private cdr = inject(ChangeDetectorRef);
  private ngZone = inject(NgZone);

  ngOnInit(): void {
    if (validateCurrentUser(this.currentUser)) {
      const userEmailKey = formatEmailKey(this.currentUser!.email!);
      this.loadVideos(userEmailKey);
    }
  }

  ngAfterViewInit(): void {
    this.setupVideoPlayers();
    this.videoPlayers.changes.subscribe(() => this.setupVideoPlayers());
  }

  // En video-grid.component.ts
  handleFileSelected(file: File): void {
    console.log('handleFileSelected called with file:', file.name);

    if (!this.userEmailKey) {
      console.log('No userEmailKey available');
      return;
    }

    console.log('Starting upload process...');
    this.state = updateState(
      this.state,
      {
        uploadProgress: 0,
        uploadedSize: 0,
        totalSize: file.size,
      },
      this.ngZone,
      this.cdr
    );

    console.log('Calling videoService.uploadVideo');
    this.videoService
      .uploadVideo(this.userEmailKey, file, (progress, uploaded, total) => {
        this.ngZone.run(() => {
          this.state = updateState(
            this.state,
            {
              uploadProgress: progress,
              uploadedSize: uploaded,
              totalSize: total,
            },
            this.ngZone,
            this.cdr
          );
        });
      })
      .then((downloadURL) => {
        console.log('Upload complete, downloadURL:', downloadURL);
        this.handleUploadComplete(downloadURL);
        this.resetUploadState();
      })
      .catch((error) => {
        console.error('Upload error:', error);
        this.handleUploadError(error);
      });
  }

  private resetUploadState(): void {
    this.state = updateState(
      this.state,
      {
        uploadProgress: null,
        uploadedSize: 0,
        totalSize: 0,
      },
      this.ngZone,
      this.cdr
    );
  }

  private handleUploadError(error: any): void {
    this.ngZone.run(() => {
      this.toast.show('Error al subir el video', 'error');
      this.resetUploadState();
    });
  }

  toggleExpansion(videoUrl: string): void {
    this.state = updateState(
      this.state,
      {
        expandedStates: {
          ...this.state.expandedStates,
          [videoUrl]: !this.state.expandedStates[videoUrl],
        },
      },
      this.ngZone,
      this.cdr
    );
  }

  confirmDeleteVideo(videoUrl: string): void {
    this.confirmationModal.show(
      {
        title: 'Eliminar Video',
        message: '¿Estás seguro de que deseas eliminar este video?',
      },
      () => this.deleteVideo(videoUrl)
    );
  }

  private async deleteVideo(videoUrl: string): Promise<void> {
    if (!validateCurrentUser(this.currentUser)) return;

    this.state = updateState(
      this.state,
      { isLoading: true },
      this.ngZone,
      this.cdr
    );

    try {
      await this.videoService.deleteVideo(videoUrl);
      const updatedVideos = this.state.userVideos.filter(
        (vid) => vid !== videoUrl
      );
      await updateUserVideos(
        updatedVideos,
        this.currentUser!,
        this.firebaseService
      );
      this.toast.show('Video eliminado exitosamente', 'success');
      this.loadVideos(formatEmailKey(this.currentUser!.email!));
    } catch (error) {
      handleError('Error eliminando video', error, this.toast, this.ngZone);
    } finally {
      this.state = updateState(
        this.state,
        { isLoading: false },
        this.ngZone,
        this.cdr
      );
    }
  }

  private setupVideoPlayers(): void {
    setupVideoPlayers(this.videoPlayers, (e: Event) => this.onVideoPlay(e));
  }

  private onVideoPlay(event: Event): void {
    onVideoPlay(event, this.videoPlayers);
  }

  private async loadVideos(userEmailKey: string): Promise<void> {
    this.state = updateState(
      this.state,
      { isLoading: true },
      this.ngZone,
      this.cdr
    );

    try {
      const videos = await this.videoService.getVideos(userEmailKey);
      const sortedVideos = sortVideosByDate(videos);
      const totalUploadedMB = await calculateTotalSize(
        sortedVideos,
        this.videoService
      );

      this.state = updateState(
        this.state,
        {
          userVideos: sortedVideos,
          expandedStates: initExpandedStates(sortedVideos),
          totalUploadedMB,
          isLoading: false,
        },
        this.ngZone,
        this.cdr
      );
    } catch (error) {
      handleError('Error cargando videos', error, this.toast, this.ngZone);
      this.state = updateState(
        this.state,
        { isLoading: false },
        this.ngZone,
        this.cdr
      );
    }
  }

  handleUploadComplete(downloadURL: string): void {
    if (!this.currentUser || !this.userEmailKey) return;

    this.ngZone.run(() => {
      updateUserVideos(
        [...this.state.userVideos, downloadURL],
        this.currentUser!,
        this.firebaseService
      ).then(() => this.loadVideos(this.userEmailKey!));
    });
  }

  trackByVideoUrl = trackByVideoUrl;
}
