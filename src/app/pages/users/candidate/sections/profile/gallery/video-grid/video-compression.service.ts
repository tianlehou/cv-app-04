import { Injectable } from '@angular/core';
import { AngularFireStorage } from '@angular/fire/compat/storage';
import { Observable } from 'rxjs';
import { FFmpeg } from '@ffmpeg/ffmpeg'; // Importación directa
import { fetchFile } from '@ffmpeg/util'; // Nueva utilidad para manejar archivos

@Injectable({
  providedIn: 'root'
})
export class VideoCompressionService {
  private ffmpeg = new FFmpeg(); // Instancia única de FFmpeg

  constructor(private storage: AngularFireStorage) {
    this.loadFFmpeg();
  }

  private async loadFFmpeg(): Promise<void> {
    await this.ffmpeg.load({
      coreURL: 'https://unpkg.com/@ffmpeg/core@0.11.0/dist/ffmpeg-core.js', // Ruta al core
    });
  }

  // Método para comprimir el video
  async compressVideo(file: File): Promise<Blob> {
    // Escribir el archivo en FFmpeg
    await this.ffmpeg.writeFile('input.mp4', await fetchFile(file));

    // Comandos de compresión (ajusta según tus necesidades)
    await this.ffmpeg.exec([
      '-i', 'input.mp4',
      '-vf', 'scale=640:-1',
      '-c:v', 'libx264',
      '-crf', '28',
      'output.mp4'
    ]);

    // Leer el resultado
    const data = await this.ffmpeg.readFile('output.mp4');
    return new Blob([data], { type: 'video/mp4' });
  }

  // Subir el video a Firebase (sin cambios)
  uploadVideo(blob: Blob, path: string): Observable<number | undefined> {
    const file = new File([blob], 'compressed_video.mp4', { type: 'video/mp4' });
    const task = this.storage.upload(path, file);
    return task.percentageChanges();
  }
}