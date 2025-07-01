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
      // 1. Obtener lista de imágenes desde Database
      const exampleRef = ref(this.db, this.getExamplePath(exampleId));
      const snapshot = await get(exampleRef);
      
      // 2. Eliminar nodo en Database
      await remove(exampleRef);
      
      // 3. Eliminar archivos en Storage
      try {
        if (snapshot.exists()) {
          const images = snapshot.val();
          if (Array.isArray(images)) {
            // Eliminar cada imagen individualmente usando su ruta completa
            const deletePromises = images.map(imageUrl => {
              const fileRef = storageRef(this.storage, imageUrl); 
              return deleteObject(fileRef);
            });
            await Promise.all(deletePromises);
          }
        }
        
        // Intentar eliminar la subcarpeta gallery-images
        try {
          const folderRef = storageRef(this.storage, `cv-app/examples/${exampleId}/gallery-images`);
          await deleteObject(folderRef);
        } catch (error) {
          const folderError = error as {code?: string};
          // Ignorar error si la carpeta no existe
          if (folderError.code !== 'storage/object-not-found') {
            throw folderError;
          }
        }
      } catch (storageError) {
        console.error('Error al eliminar archivos:', storageError);
        throw new Error('No se pudieron eliminar todos los archivos del ejemplo');
      }
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
