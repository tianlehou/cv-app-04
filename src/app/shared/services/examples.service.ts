import { Injectable } from '@angular/core';
import { v4 as uuidv4 } from 'uuid';

@Injectable({
  providedIn: 'root'
})
export class ExamplesService {
  constructor(
  ) { }

  getStoragePath(exampleId: string, imageName: string): string {
    return `cv-app/examples/${exampleId}/gallery-images/${imageName}`;
  }

  getExamplePath(exampleId: string): string {
    return `cv-app/examples/${exampleId}/gallery-images`;
  }

  generateExampleId(): string {
    return uuidv4();
  }
}
