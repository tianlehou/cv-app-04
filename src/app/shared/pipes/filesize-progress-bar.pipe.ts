// este pipe es para la barra de progreso de subida de videos
import { Pipe, PipeTransform } from '@angular/core';
import { filesize } from 'filesize';

@Pipe({ name: 'filesize' })
export class FileSizePipeProgressBar implements PipeTransform {
    transform(value: number): string {
        return filesize(value || 0, { round: 1 });
    }
}
