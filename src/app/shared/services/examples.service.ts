import { Injectable, inject, EnvironmentInjector, runInInjectionContext } from '@angular/core';
import { Database, ref, set, remove, get, update } from '@angular/fire/database';
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

  // Obtiene la ruta de almacenamiento para una imagen específica de un ejemplo.
  // Utiliza el ID del ejemplo y el nombre de la imagen para construir la ruta.
  getStoragePath(exampleId: string, imageName: string): string {
    return `cv-app/examples/${exampleId}/gallery-images/${imageName}`;
  }

  // Obtiene la ruta de un ejemplo específico en la base de datos.
  // Utiliza el ID del ejemplo para construir la ruta.
  getExamplePath(exampleId: string): string {
    return `cv-app/examples/${exampleId}/gallery-images`;
  }

  // Actualiza los datos de un ejemplo específico en la base de datos.
  // Utiliza el ID del ejemplo y los datos a actualizar.
  async updateExampleData(exampleId: string, data: any): Promise<void> {
    return runInInjectionContext(this.injector, async () => {
      try {
        const exampleRef = ref(this.db, `cv-app/examples/${exampleId}`);
        await update(exampleRef, data);
      } catch (error) {
        console.error('Error al actualizar el ejemplo:', error);
        throw error;
      }
    });
  }

  // Obtiene el siguiente número de ejemplo disponible en la base de datos.
  // Busca el primer hueco en la secuencia de IDs de ejemplos existentes.
  private async getNextExampleNumber(): Promise<string> {
    return runInInjectionContext(this.injector, async () => {
      const examplesRef = ref(this.db, 'cv-app/examples');
      const snapshot = await get(examplesRef);

      if (!snapshot.exists()) {
        return '01';
      }

      const exampleIds = Object.keys(snapshot.val()).map(id => parseInt(id));

      // Si no hay ejemplos con ID '01', lo devolvemos
      if (!exampleIds.includes(1)) {
        return '01';
      }

      // Buscar el primer hueco disponible en la secuencia
      const maxId = Math.max(...exampleIds);
      for (let i = 1; i <= maxId; i++) {
        if (!exampleIds.includes(i)) {
          return i.toString().padStart(2, '0');
        }
      }

      // Si no hay huecos, devolver el siguiente número después del máximo
      return (maxId + 1).toString().padStart(2, '0');
    });
  }

  // Genera un nuevo ID de ejemplo basado en el siguiente número disponible.
  // Utiliza el método getNextExampleNumber para obtener un ID único.
  async generateExampleId(): Promise<string> {
    return await this.getNextExampleNumber();
  }

  // Crea un nuevo ejemplo en la base de datos con un ID específico y datos iniciales.
  // Si el ID ya existe, lanza un error.
  async createExample(exampleId: string, initialData: any): Promise<void> {
    return runInInjectionContext(this.injector, async () => {
      try {
        const exampleRef = ref(this.db, `cv-app/examples/${exampleId}`);
        await set(exampleRef, initialData);
      } catch (error) {
        console.error('Error creating example:', error);
        throw error;
      }
    });
  }

  // Elimina un ejemplo específico de la base de datos y sus archivos asociados en Storage.
  // Devuelve un objeto con los IDs restantes y el nuevo ID actual si corresponde.
  async deleteExample(exampleId: string): Promise<{ remainingIds: string[], newCurrentId?: string }> {
    return runInInjectionContext(this.injector, async () => {
      // 1. Obtener lista de imágenes
      const exampleRef = ref(this.db, `cv-app/examples/${exampleId}/gallery-images`);
      const snapshot = await get(exampleRef);

      // 2. Eliminar nodo en Database
      await remove(ref(this.db, `cv-app/examples/${exampleId}`));

      // 3. Eliminar archivos en Storage
      try {
        if (snapshot.exists()) {
          const images = snapshot.val();
          if (Array.isArray(images)) {
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
          const folderError = error as { code?: string };
          // Ignorar error si la carpeta no existe
          if (folderError.code !== 'storage/object-not-found') {
            throw folderError;
          }
        }
      } catch (storageError) {
        console.error('Error al eliminar archivos:', storageError);
        throw new Error('No se pudieron eliminar todos los archivos del ejemplo');
      }

      // 4. Obtener IDs restantes
      const remainingIds = await this.getAllExampleIds();
      let newCurrentId;

      if (remainingIds.length > 0) {
        // Buscar el ID más cercano (siguiente o anterior)
        const originalIndex = remainingIds.indexOf(exampleId);
        if (originalIndex >= 0 && originalIndex < remainingIds.length - 1) {
          // Mostrar siguiente ID si existe
          newCurrentId = remainingIds[originalIndex];
        } else {
          // Mostrar anterior si era el último
          newCurrentId = remainingIds[Math.max(0, remainingIds.length - 1)];
        }
        this.setCurrentExampleId(newCurrentId);
      }

      return { remainingIds, newCurrentId };
    });
  }

  // Obtiene todos los IDs de ejemplos existentes en la base de datos.
  // Devuelve un array de strings con los IDs de los ejemplos.
  async getAllExampleIds(): Promise<string[]> {
    return runInInjectionContext(this.injector, async () => {
      const examplesRef = ref(this.db, 'cv-app/examples');
      const snapshot = await get(examplesRef);
      return snapshot.exists() ? Object.keys(snapshot.val()) : [];
    });
  }

  // Establece el ID del ejemplo actual en el BehaviorSubject.
  // Esto permite que otros componentes se suscriban a los cambios del ID actual.
  setCurrentExampleId(exampleId: string): void {
    this.currentExampleId.next(exampleId);
  }


  // Obtiene el ID del ejemplo actual desde el BehaviorSubject.
  // Si no se ha establecido, devuelve una cadena vacía.
  getCurrentExampleId(): string {
    return this.currentExampleId.getValue();
  }

  // Obtiene la ruta de las imágenes de un ejemplo específico.
  // Si no se proporciona un ID, utiliza el ID del ejemplo actual.
  getExampleImagesPath(exampleId?: string): string {
    const id = exampleId || this.getCurrentExampleId();
    return `cv-app/examples/${id}/gallery-images`;
  }

  getExampleVideosPath(exampleId?: string): string {
    const id = exampleId || this.getCurrentExampleId();
    return `cv-app/examples/${id}/gallery-videos`;
  }
}
