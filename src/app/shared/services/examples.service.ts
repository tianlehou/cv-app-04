import { Injectable } from '@angular/core';
import { Database, ref, set, remove, get } from '@angular/fire/database';
import { Storage, ref as storageRef, deleteObject } from '@angular/fire/storage';

@Injectable({
  providedIn: 'root'
})
export class ExamplesService {
  constructor(
    private db: Database,
    private storage: Storage
  ) { }

  private async getNextExampleNumber(): Promise<string> {
    const examplesRef = ref(this.db, 'cv-app/examples');
    const snapshot = await get(examplesRef);
    
    if (!snapshot.exists()) {
      return '01';
    }
    
    const examples = snapshot.val();
    const count = Object.keys(examples).length;
    return (count + 1).toString().padStart(2, '0');
  }

  getStoragePath(exampleId: string, imageName: string): string {
    return `cv-app/examples/${exampleId}/gallery-images/${imageName}`;
  }

  getExamplePath(exampleId: string): string {
    return `cv-app/examples/${exampleId}/gallery-images`;
  }

  async generateExampleId(): Promise<string> {
    return await this.getNextExampleNumber();
  }

  async createExample(exampleId: string, initialData: any): Promise<void> {
    const exampleRef = ref(this.db, this.getExamplePath(exampleId));
    await set(exampleRef, initialData);
  }

  async deleteExample(exampleId: string): Promise<void> {
    const exampleRef = ref(this.db, this.getExamplePath(exampleId));
    await remove(exampleRef);
    
    const storageExampleRef = storageRef(this.storage, `cv-app/examples/${exampleId}`);
    await deleteObject(storageExampleRef).catch(error => {
      console.error('Error al eliminar archivos:', error);
    });
  }

  async getAllExampleIds(): Promise<string[]> {
    const examplesRef = ref(this.db, 'cv-app/examples');
    const snapshot = await get(examplesRef);
    
    if (!snapshot.exists()) {
      return [];
    }
    
    return Object.keys(snapshot.val());
  }
}
