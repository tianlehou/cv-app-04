import { Injectable, inject, EnvironmentInjector, runInInjectionContext } from '@angular/core';
import { Database, ref, set, remove, get } from '@angular/fire/database';
import { Storage, ref as storageRef, deleteObject } from '@angular/fire/storage';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ExamplesService {
  private injector = inject(EnvironmentInjector);
  private currentExampleId = new BehaviorSubject<string>('');
  currentExampleId$ = this.currentExampleId.asObservable();

  constructor(
    private db: Database,
    private storage: Storage
  ) { }

  private async getNextExampleNumber(): Promise<string> {
    return runInInjectionContext(this.injector, async () => {
      const examplesRef = ref(this.db, 'cv-app/examples');
      const snapshot = await get(examplesRef);
      
      if (!snapshot.exists()) {
        return '01';
      }
      
      const examples = snapshot.val();
      const exampleIds = Object.keys(examples);
      
      // Si no hay ejemplos con ID '01', lo devolvemos
      if (!exampleIds.includes('01')) {
        return '01';
      }
      
      // Si ya existe '01', continuamos con la secuencia normal
      const count = exampleIds.length;
      return (count + 1).toString().padStart(2, '0');
    });
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
    return runInInjectionContext(this.injector, async () => {
      try {
        const exampleRef = ref(this.db, this.getExamplePath(exampleId));
        await set(exampleRef, initialData);
      } catch (error) {
        console.error('Error creating example:', error);
        throw error;
      }
    });
  }

  async deleteExample(exampleId: string): Promise<void> {
    return runInInjectionContext(this.injector, async () => {
      const exampleRef = ref(this.db, this.getExamplePath(exampleId));
      await remove(exampleRef);
      
      const storageExampleRef = storageRef(this.storage, `cv-app/examples/${exampleId}`);
      await deleteObject(storageExampleRef).catch(error => {
        console.error('Error al eliminar archivos:', error);
      });
    });
  }

  async getAllExampleIds(): Promise<string[]> {
    return runInInjectionContext(this.injector, async () => {
      const examplesRef = ref(this.db, 'cv-app/examples');
      const snapshot = await get(examplesRef);
      
      if (!snapshot.exists()) {
        return [];
      }
      
      return Object.keys(snapshot.val());
    });
  }

  setCurrentExampleId(exampleId: string): void {
    this.currentExampleId.next(exampleId);
  }
  
  getCurrentExampleId(): string {
    return this.currentExampleId.getValue();
  }
  
  getExampleImagesPath(exampleId?: string): string {
    const id = exampleId || this.getCurrentExampleId();
    return `cv-app/examples/${id}/gallery-images`;
  }
}
