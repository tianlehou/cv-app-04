// video.utils.ts
import { User } from '@angular/fire/auth';
import { QueryList, ElementRef, ChangeDetectorRef } from '@angular/core';
import { NgZone } from '@angular/core';
import { ToastService } from '../../../../../../shared/services/toast.service';
import { VideoService } from './video.service';
import { FirebaseService } from '../../../../../../shared/services/firebase.service';

export function formatEmailKey(email: string): string {
  return email.replace(/\./g, '_');
}

export function sortVideosByDate(videos: string[]): string[] {
  return [...videos].sort((a, b) => {
    const getTimestamp = (url: string) => {
      const filename = url.split('%2F').pop()?.split('?')[0] || '';
      const timestampMatch = filename.match(/-(\d+)\./);
      return timestampMatch ? parseInt(timestampMatch[1], 10) : 0;
    };
    return getTimestamp(b) - getTimestamp(a);
  });
}

export function initExpandedStates(videos: string[]): Record<string, boolean> {
  return videos.reduce((acc, video) => {
    acc[video] = false;
    return acc;
  }, {} as Record<string, boolean>);
}

export function validateCurrentUser(user: User | null): user is User {
  return !!user?.email;
}

export function trackByVideoUrl(index: number, videoUrl: string): string {
  return videoUrl;
}

export function setupVideoPlayers(
  videoPlayers: QueryList<ElementRef<HTMLVideoElement>>,
  onPlayCallback: (event: Event) => void
): void {
  videoPlayers.forEach(video => {
    video.nativeElement.addEventListener('play', onPlayCallback);
  });
}

export function onVideoPlay(
  event: Event,
  videoPlayers: QueryList<ElementRef<HTMLVideoElement>>
): void {
  const playingVideo = event.target as HTMLVideoElement;
  videoPlayers.forEach(video => {
    if (video.nativeElement !== playingVideo) {
      video.nativeElement.pause();
    }
  });
}

export function handleError(
  message: string,
  error: any,
  toastService: ToastService,
  ngZone: NgZone
): void {
  ngZone.run(() => {
    console.error(`${message}:`, error);
    toastService.show(message, 'error');
  });
}

export async function calculateTotalSize(
  videos: string[],
  videoService: VideoService
): Promise<number> {
  try {
    const totalBytes = await videoService.calculateTotalSize(videos);
    return totalBytes / 1048576; // Convertir a MB
  } catch (error) {
    console.error('Error calculando tamaño total:', error);
    return 0;
  }
}

export function updateState<T>(
  currentState: T,
  partialState: Partial<T>,
  ngZone: NgZone,
  cdr: ChangeDetectorRef
): T {
  const newState = { ...currentState, ...partialState };
  ngZone.run(() => {
    cdr.detectChanges();
  });
  return newState;
}

export async function handleVideoUpload(
  file: File,
  userEmailKey: string,
  videoService: VideoService,
  updateProgressCallback: (progress: number, uploaded: number, total: number) => void
): Promise<string> {
  return await videoService.uploadVideo(
    userEmailKey,
    file,
    updateProgressCallback
  );
}

export async function updateUserVideos(
  videos: string[],
  currentUser: User,
  firebaseService: FirebaseService
): Promise<void> {
  const userEmailKey = formatEmailKey(currentUser.email!);
  const currentData = await firebaseService.getUserData(userEmailKey);
  const updatedData = {
    profileData: {
      ...currentData.profileData,
      multimedia: {
        ...currentData.profileData?.multimedia,
        galleryVideos: videos
      }
    }
  };
  await firebaseService.updateUserData(currentUser.email!, updatedData);
}