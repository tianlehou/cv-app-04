import { Injectable } from '@angular/core';
import imageCompression from 'browser-image-compression';

@Injectable({
  providedIn: 'root'
})
export class ImageCompressionService {
  private readonly MAX_WIDTH = 800; // Ancho máximo en píxeles
  private readonly MAX_HEIGHT = 800; // Alto máximo en píxeles
  private readonly MAX_SIZE_MB = 0.1; // Tamaño máximo en MB (100KB)
  private readonly QUALITY = 0.7; // Calidad de compresión (0.7 = 70%)

  async compressImage(file: File): Promise<File> {
    const options = {
      maxSizeMB: this.MAX_SIZE_MB,
      maxWidthOrHeight: Math.max(this.MAX_WIDTH, this.MAX_HEIGHT),
      useWebWorker: true,
      maxIteration: 10,
      fileType: 'image/jpeg',
      initialQuality: this.QUALITY,
      alwaysKeepResolution: false
    };

    try {
      console.log('Tamaño original:', (file.size / 1024 / 1024).toFixed(2), 'MB');
      const compressedFile = await imageCompression(file, options);
      console.log('Tamaño comprimido:', (compressedFile.size / 1024 / 1024).toFixed(2), 'MB');
      return compressedFile;
    } catch (error) {
      console.error('Error al comprimir imagen:', error);
      throw error;
    }
  }
}