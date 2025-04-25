import { Injectable } from '@angular/core';
import { Storage, ref, getDownloadURL, deleteObject, uploadBytesResumable, getMetadata } from '@angular/fire/storage';
import { FirebaseService } from '../../../../../../shared/services/firebase.service';

@Injectable({ providedIn: 'root' })
export class VideoService {
  constructor(
    private storage: Storage,
    private firebaseService: FirebaseService
  ) {}

  async getVideos(userEmailKey: string): Promise<string[]> {
    const userData = await this.firebaseService.getUserData(userEmailKey);
    return userData?.profileData?.multimedia?.galleryVideos || [];
  }

  async uploadVideo(
    userEmailKey: string,
    file: File,
    progressCallback: (progress: number, uploaded: number, total: number) => void
  ): Promise<string> {
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
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          resolve(downloadURL);
        }
      );
    });
  }

  async deleteVideo(videoUrl: string): Promise<void> {
    const videoRef = ref(this.storage, videoUrl);
    await deleteObject(videoRef);
  }

  async calculateTotalSize(videos: string[]): Promise<number> {
    let totalBytes = 0;
    const metadataPromises = videos.map(async (url) => {
      try {
        const videoRef = ref(this.storage, url);
        const metadata = await getMetadata(videoRef);
        return metadata.size || 0;
      } catch {
        return 0;
      }
    });
    
    const sizes = await Promise.all(metadataPromises);
    return sizes.reduce((sum, size) => sum + size, 0);
  }
}