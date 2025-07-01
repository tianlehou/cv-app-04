// video-grid.component.ts
import { Component, Input, OnInit, ChangeDetectorRef, NgZone } from '@angular/core';
import { ViewChildren, QueryList, ElementRef, AfterViewInit, inject } from '@angular/core';
import { User } from '@angular/fire/auth';
import { CommonModule } from '@angular/common';
import { ToastService } from 'src/app/shared/services/toast.service';
import { FirebaseService } from 'src/app/shared/services/firebase.service';
import { ConfirmationModalService } from 'src/app/shared/services/confirmation-modal.service';
import { Storage, ref, deleteObject, getMetadata } from '@angular/fire/storage';
import { VideoInfoBarComponent } from './video-info-bar/video-info-bar.component';
import { VideoUploadButtonComponent } from './video-upload-button/video-upload-button.component';
import { VideoUploadProgressBarComponent } from './video-upload-progress-bar/video-upload-progress-bar.component';
import { VideoEmptyGalleryMessageComponent } from './video-empty-gallery-message/video-empty-gallery-message.component';

interface VideoGridState {
  userVideos: string[];
  isLoading: boolean;
  expandedStates: Record<string, boolean>;
  totalUploadedMB: number;
  uploadProgress: number | null;
  uploadedSize: number;
  totalSize: number;
}

@Component({
  selector: 'app-video-grid',
  standalone: true,
  imports: [
    CommonModule,
    VideoInfoBarComponent,
    VideoUploadButtonComponent,
    VideoUploadProgressBarComponent,
    VideoEmptyGalleryMessageComponent,
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

  private storage = inject(Storage);
  private toast = inject(ToastService);
  private confirmationModal = inject(ConfirmationModalService);
  private firebaseService = inject(FirebaseService);
  private cdr = inject(ChangeDetectorRef);
  private ngZone = inject(NgZone);

  // Funciones movidas de video.utils.ts
  private formatEmailKey(email: string): string {
    return email.replace(/\./g, '_');
  }

  private sortVideosByDate(videos: string[]): string[] {
    return [...videos].sort((a, b) => {
      const getTimestamp = (url: string) => {
        const filename = url.split('%2F').pop()?.split('?')[0] || '';
        const timestampMatch = filename.match(/-(\d+)\./);
        return timestampMatch ? parseInt(timestampMatch[1], 10) : 0;
      };
      return getTimestamp(b) - getTimestamp(a);
    });
  }

  private initExpandedStates(videos: string[]): Record<string, boolean> {
    return videos.reduce((acc, video) => {
      acc[video] = false;
      return acc;
    }, {} as Record<string, boolean>);
  }

  private validateCurrentUser(user: User | null): user is User {
    return !!user?.email;
  }

  protected trackByVideoUrl(index: number, videoUrl: string): string {
    return videoUrl;
  }

  private setupVideoPlayers(): void {
    this.videoPlayers.forEach((video) => {
      video.nativeElement.addEventListener('play', (e: Event) =>
        this.onVideoPlay(e)
      );
    });
  }

  private onVideoPlay(event: Event): void {
    const playingVideo = event.target as HTMLVideoElement;
    this.videoPlayers.forEach((video) => {
      if (video.nativeElement !== playingVideo) {
        video.nativeElement.pause();
      }
    });
  }

  private handleError(message: string, error: any): void {
    this.ngZone.run(() => {
      console.error(`${message}:`, error);
      this.toast.show(message, 'error');
    });
  }

  private updateState<T>(currentState: T, partialState: Partial<T>): T {
    const newState = { ...currentState, ...partialState };
    this.ngZone.run(() => {
      this.cdr.detectChanges();
    });
    return newState;
  }

  private async updateUserVideos(videos: string[]): Promise<void> {
    if (!this.currentUser?.email) return;

    const userEmailKey = this.formatEmailKey(this.currentUser.email);
    const currentData = await this.firebaseService.getUserData(userEmailKey);

    await this.firebaseService.updateUserData(this.currentUser.email, {
      profileData: {
        ...currentData.profileData,
        multimedia: {
          ...currentData.profileData?.multimedia,
          galleryVideos: videos,
        },
      },
    });
  }

  // Métodos movidos de video.service.ts
  private async getVideos(userEmailKey: string): Promise<string[]> {
    const userData = await this.firebaseService.getUserData(userEmailKey);
    return userData?.profileData?.multimedia?.galleryVideos || [];
  }

  private async deleteVideoFromStorage(videoUrl: string): Promise<void> {
    const videoRef = ref(this.storage, videoUrl);
    await deleteObject(videoRef);
  }

  // Métodos del componente
  get userEmailKey(): string | null {
    return this.currentUser?.email
      ? this.formatEmailKey(this.currentUser.email)
      : null;
  }

  ngOnInit(): void {
    if (this.validateCurrentUser(this.currentUser)) {
      const userEmailKey = this.formatEmailKey(this.currentUser!.email!);
      this.loadVideos(userEmailKey);
    }
  }

  ngAfterViewInit(): void {
    this.setupVideoPlayers();
    this.videoPlayers.changes.subscribe(() => this.setupVideoPlayers());
  }

  private resetUploadState(): void {
    this.state = this.updateState(this.state, {
      uploadProgress: null,
      uploadedSize: 0,
      totalSize: 0,
    });
  }

  toggleExpansion(videoUrl: string): void {
    this.state = this.updateState(this.state, {
      expandedStates: {
        ...this.state.expandedStates,
        [videoUrl]: !this.state.expandedStates[videoUrl],
      },
    });
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
    if (!this.validateCurrentUser(this.currentUser)) return;

    this.state = this.updateState(this.state, { isLoading: true });

    try {
      await this.deleteVideoFromStorage(videoUrl);
      const updatedVideos = this.state.userVideos.filter(
        (vid) => vid !== videoUrl
      );
      await this.updateUserVideos(updatedVideos);
      this.toast.show('Video eliminado exitosamente', 'success');
      this.loadVideos(this.formatEmailKey(this.currentUser!.email!));
    } catch (error) {
      this.handleError('Error eliminando video', error);
    } finally {
      this.state = this.updateState(this.state, { isLoading: false });
    }
  }

  private async loadVideos(userEmailKey: string): Promise<void> {
    this.state = this.updateState(this.state, { isLoading: true });

    try {
      const videos = await this.getVideos(userEmailKey);
      const sortedVideos = this.sortVideosByDate(videos);

      this.state = this.updateState(this.state, {
        userVideos: sortedVideos,
        expandedStates: this.initExpandedStates(sortedVideos),
        isLoading: false,
      });
    } catch (error) {
      this.handleError('Error cargando videos', error);
      this.state = this.updateState(this.state, { isLoading: false });
    }
  }

  handleUploadComplete(downloadURL: string): void {
    if (!this.currentUser || !this.userEmailKey) return;

    this.ngZone.run(() => {
      this.resetUploadState();
      this.updateUserVideos([...this.state.userVideos, downloadURL]).then(() =>
        this.loadVideos(this.userEmailKey!)
      );
    });
  }

  handleUploadProgress(progressData: {
    progress: number;
    uploaded: number;
    total: number;
  }): void {
    this.state = this.updateState(this.state, {
      uploadProgress: progressData.progress,
      uploadedSize: progressData.uploaded,
      totalSize: progressData.total,
    });
  }
}
