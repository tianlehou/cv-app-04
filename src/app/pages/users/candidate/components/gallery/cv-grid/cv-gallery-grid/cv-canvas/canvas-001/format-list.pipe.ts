// format-list.pipe.ts
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'formatList'
})
export class FormatListPipe implements PipeTransform {
  transform(value: string): string {
    if (!value) return 'No especificado';
    
    // Reemplaza comas por saltos de línea y agrega asterisco a cada línea
    return value
      .split(', ')
      .map(item => item.trim())
      .filter(item => item.length > 0)
      .map(item => `• ${item}`) // Usa • en lugar de * para una viñeta más profesional
      .join('\n');
  }
}