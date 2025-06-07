import { Injectable, inject, runInInjectionContext, EnvironmentInjector } from '@angular/core';
import { Storage, ref, getDownloadURL, deleteObject, getMetadata } from '@angular/fire/storage';
import { FirebaseService } from 'src/app/shared/services/firebase.service';

@Injectable({ providedIn: 'root' })
export class VideoService {
  private injector = inject(EnvironmentInjector);
  private storage = inject(Storage);

  constructor(private firebaseService: FirebaseService) {}

  async getVideos(userEmailKey: string): Promise<string[]> {
    return runInInjectionContext(this.injector, async () => {
      const userData = await this.firebaseService.getUserData(userEmailKey);
      return userData?.profileData?.multimedia?.galleryVideos || [];
    });
  }

  async deleteVideo(videoUrl: string): Promise<void> {
    return runInInjectionContext(this.injector, async () => {
      const videoRef = ref(this.storage, videoUrl);
      await deleteObject(videoRef);
    });
  }

  async calculateTotalSize(videos: string[]): Promise<number> {
    return runInInjectionContext(this.injector, async () => {
      if (!videos || videos.length === 0) return 0;

      try {
        const sizes = await Promise.all(
          videos.map(async (url) => {
            try {
              const videoRef = ref(this.storage, url);
              const metadata = await getMetadata(videoRef);
              return metadata.size || 0;
            } catch (error) {
              console.error('Error getting video metadata:', error);
              return 0;
            }
          })
        );

        return sizes.reduce((sum, size) => sum + size, 0);
      } catch (error) {
        console.error('Error calculating total video size:', error);
        return 0;
      }
    });
  }
}