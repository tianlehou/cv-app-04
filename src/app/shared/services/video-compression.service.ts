import { Injectable } from '@angular/core';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';

@Injectable({
  providedIn: 'root'
})
export class VideoCompressionService {
  private ffmpeg = new FFmpeg();
  private isFFmpegLoaded = false;

  constructor() {
    this.loadFFmpeg();
  }

  private async loadFFmpeg() {
    if (!this.isFFmpegLoaded) {
      try {
        await this.ffmpeg.load({
          coreURL: 'https://unpkg.com/@ffmpeg/core@0.11.0/dist/ffmpeg-core.js'
        });
        this.isFFmpegLoaded = true;
      } catch (error) {
        console.error('Error al cargar FFmpeg:', error);
        throw error;
      }
    }
  }

  async compressVideo(file: File, options: VideoCompressionOptions = {}): Promise<File> {
    if (!this.isFFmpegLoaded) {
      await this.loadFFmpeg();
    }

    const {
      maxWidth = 1280,
      maxHeight = 720,
      bitrate = '2000k',
      fps = 30,
      format = 'mp4',
      quality = 28 // 0-51, donde 0 es la mejor calidad (sin pérdida)
    } = options;

    try {
      console.log('Iniciando compresión de video...');
      console.log('Tamaño original:', (file.size / 1024 / 1024).toFixed(2), 'MB');

      // Escribir el archivo al sistema de archivos en memoria de FFmpeg
      await this.ffmpeg.writeFile('input', await fetchFile(file));

      // Ejecutar FFmpeg
      await this.ffmpeg.exec([
        '-i', 'input',
        '-vf', `scale='min(${maxWidth},iw)':'min(${maxHeight},ih)':force_original_aspect_ratio=decrease`,
        '-c:v', 'libx264',
        '-preset', 'slow',
        '-crf', quality.toString(),
        '-b:v', bitrate,
        '-maxrate', bitrate,
        '-bufsize', (parseInt(bitrate) * 2) + 'k',
        '-r', fps.toString(),
        '-pix_fmt', 'yuv420p',
        '-movflags', '+faststart',
        '-y', 'output.mp4'
      ]);

      // Leer el resultado
      const data = await this.ffmpeg.readFile('output.mp4');

      // Crear un nuevo archivo a partir de los datos comprimidos
      const compressedBlob = new Blob([data], { type: 'video/mp4' });
      const compressedFile = new File(
        [compressedBlob],
        file.name.replace(/\.[^/.]+$/, '') + '_compressed.mp4',
        { type: 'video/mp4' }
      );

      console.log('Compresión completada');
      console.log('Tamaño comprimido:', (compressedFile.size / 1024 / 1024).toFixed(2), 'MB');

      return compressedFile;
    } catch (error) {
      console.error('Error al comprimir el video:', error);
      throw error;
    } finally {
      // Limpiar archivos temporales
      try {
        await this.ffmpeg.deleteFile('input');
        await this.ffmpeg.deleteFile('output.mp4');
      } catch (e) {
        console.warn('Error al limpiar archivos temporales:', e);
      }
    }
  }
}

export interface VideoCompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  bitrate?: string;
  fps?: number;
  format?: 'mp4' | 'webm' | 'ogg';
  quality?: number; // 0-51, donde 0 es la mejor calidad (sin pérdida)
}
