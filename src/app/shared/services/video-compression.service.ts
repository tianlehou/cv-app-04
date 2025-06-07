import { Injectable } from '@angular/core';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';

@Injectable({
  providedIn: 'root'
})
export class VideoCompressionService {
  private ffmpeg = new FFmpeg(); 
  private isLoaded = false;

  async compressVideo(file: File): Promise<File> {
    if (!this.isLoaded) {
      await this.ffmpeg.load({
        coreURL: 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/ffmpeg-core.js',
        wasmURL: 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/ffmpeg-core.wasm'
      });
      this.isLoaded = true;
    }

    const inputName = 'input.' + file.name.split('.').pop();
    const outputName = 'compressed.mp4';

    // Write file to FFmpeg
    await this.ffmpeg.writeFile(inputName, await fetchFile(file));

    // Execute compression (adjust parameters as needed)
    await this.ffmpeg.exec([
      '-i', inputName,
      '-c:v', 'libx264',
      '-crf', '28',         // Quality (18-28 is good balance)
      '-preset', 'fast',    // Compression speed
      '-vf', 'scale=640:-2', // Resize to 640px width
      '-c:a', 'aac',        // Audio codec
      '-b:a', '128k',       // Audio bitrate
      outputName
    ]);

    // Read the result
    const data = await this.ffmpeg.readFile(outputName);
    return new File([data], file.name, { type: 'video/mp4' });
  }
}