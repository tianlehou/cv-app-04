import { Injectable, inject, runInInjectionContext, EnvironmentInjector } from '@angular/core';
import { Storage, ref, getDownloadURL, deleteObject, uploadBytesResumable, getMetadata } from '@angular/fire/storage';
import { FirebaseService } from 'src/app/shared/services/firebase.service';

@Injectable({ providedIn: 'root' })
export class VideoService {
  private injector = inject(EnvironmentInjector);

  constructor(
    private storage: Storage,
    private firebaseService: FirebaseService
  ) { }

  async getVideos(userEmailKey: string): Promise<string[]> {
    return runInInjectionContext(this.injector, async () => {
      const userData = await this.firebaseService.getUserData(userEmailKey);
      return userData?.profileData?.multimedia?.galleryVideos || [];
    });
  }

  async uploadVideo(
    userEmailKey: string,
    file: File,
    progressCallback: (progress: number, uploaded: number, total: number) => void
  ): Promise<string> {
    return runInInjectionContext(this.injector, async () => {
      const videoName = `gallery-video-${Date.now()}.${file.name.split('.').pop()}`;
      const storageRef = ref(this.storage, `cv-app/users/${userEmailKey}/gallery-videos/${videoName}`);

      const uploadTask = uploadBytesResumable(storageRef, file);

      return new Promise((resolve, reject) => {
        uploadTask.on(
          'state_changed',
          (snapshot) => {
            const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
            progressCallback(progress, snapshot.bytesTransferred, snapshot.totalBytes);
          },
          (error) => reject(error),
          () => {
            // Extraemos la lógica de getDownloadURL a una función separada
            runInInjectionContext(this.injector, async () => {
              try {
                const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                resolve(downloadURL);
              } catch (error) {
                reject(error);
              }
            });
          }
        );
      });
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