import { Pipe, PipeTransform } from '@angular/core';
import { filesize } from 'filesize';

@Pipe({ name: 'filesize' })
export class FileSizePipe implements PipeTransform {
    transform(value: number): string {
        return filesize(value || 0, { round: 1 });
    }
}
