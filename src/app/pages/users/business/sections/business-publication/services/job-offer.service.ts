import { EnvironmentInjector, Injectable, inject, runInInjectionContext } from '@angular/core';
import { JobOffer } from '../job-offer.model';
import { Observable, from, throwError } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { FirebaseService } from 'src/app/shared/services/firebase.service';
import { DataSnapshot } from '@angular/fire/database';
import { AuthService } from 'src/app/pages/home/auth/auth.service';
import { Database, get, ref } from '@angular/fire/database';

@Injectable({
  providedIn: 'root'
})
export class JobOfferService {
  private firebaseService = inject(FirebaseService);
  private authService = inject(AuthService);
  database = inject(Database);
  injector = inject(EnvironmentInjector);

  // Método para obtener el userEmailKey del usuario actual
  private getCurrentUserEmailKey(): string {
    const currentUser = this.authService.getCurrentAuthUser();
    if (!currentUser || !currentUser.email) {
      throw new Error('Usuario no autenticado');
    }
    return this.firebaseService.formatEmailKey(currentUser.email);
  }

  // Método para encontrar el próximo ID disponible
  private async getNextAvailableJobId(userEmailKey: string): Promise<string> {
    return runInInjectionContext(this.injector, async () => {
      const jobOffersRef = ref(this.database, `cv-app/users/${userEmailKey}/job-offer`);
      const snapshot = await get(jobOffersRef);

      if (!snapshot.exists()) {
        return '0001';
      }

      const existingIds = Object.keys(snapshot.val())
        .map(id => parseInt(id))
        .sort((a, b) => a - b);

      // Buscar el primer hueco disponible en la secuencia
      for (let i = 1; i <= existingIds.length + 1; i++) {
        const expectedId = i.toString().padStart(4, '0');
        if (!existingIds.includes(i) && !snapshot.val()[expectedId]) {
          return expectedId;
        }
      }

      // Si no hay huecos, devolver el siguiente número secuencial
      const maxId = Math.max(...existingIds);
      return (maxId + 1).toString().padStart(4, '0');
    });
  }

  // Crear una nueva oferta de trabajo con ID disponible
  createJobOffer(jobOffer: Omit<JobOffer, 'id'>): Observable<string> {
    const userEmailKey = this.getCurrentUserEmailKey();
    const now = new Date();
    const nowISO = now.toISOString();
    
    // Procesar el deadline para asegurar la hora correcta en la zona horaria local
    let deadline = jobOffer.deadline;
    if (deadline) {
      // Extraer la fecha en formato YYYY-MM-DD
      const [year, month, day] = deadline.split('T')[0].split('-').map(Number);
      
      // Crear la fecha en UTC para evitar problemas de zona horaria
      const utcDeadline = new Date(Date.UTC(year, month, day, 36, 59, 59, 999));
      
      // Ajustar por el offset de la zona horaria local para mantener la hora exacta
      const timezoneOffset = new Date().getTimezoneOffset() * 60000;
      const adjustedDeadline = new Date(utcDeadline.getTime() + timezoneOffset);
      
      // Convertir a ISO string
      deadline = adjustedDeadline.toISOString();
    }
    
    return from(this.getNextAvailableJobId(userEmailKey)).pipe(
      switchMap(nextId => {
        // Obtener el nombre de la empresa del usuario actual
        return from(this.getCompanyName(userEmailKey)).pipe(
          switchMap(companyName => {
            // Crear el objeto de oferta con los datos proporcionados
            const newJobOffer: Record<string, any> = {
              ...jobOffer,
              id: nextId,
              applications: [],
              views: 0,
              likes: 0,
              saves: 0,
              createdAt: nowISO,
              updatedAt: nowISO,
              deadline: deadline, // Usar el deadline procesado
              companyId: userEmailKey,
              companyName: companyName,
              status: 'borrador' // Asegurar que el estado inicial sea 'borrador'
            };

            const jobOfferRef = this.firebaseService.getDatabaseRef(
              `cv-app/users/${userEmailKey}/job-offer/${nextId}`
            );
            
            return from(this.firebaseService.setDatabaseValue(jobOfferRef, newJobOffer)).pipe(
              map(() => nextId)
            );
          })
        );
      }),
      catchError(error => {
        console.error('Error al crear oferta de trabajo:', error);
        return throwError(() => new Error('Error al crear oferta de trabajo'));
      })
    );
  }

  // Verificar si una oferta está vencida
  private isOfferExpired(offer: JobOffer): boolean {
    // Si no hay fecha límite o no está publicada, no está vencida
    if (!offer.deadline || offer.status !== 'publicado') {
      return false;
    }
    
    const deadline = new Date(offer.deadline);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return deadline < today;
  }

  // Actualizar el estado de vencimiento de una oferta
  private updateExpiredStatus(offer: JobOffer): JobOffer {
    if (this.isOfferExpired(offer)) {
      return {
        ...offer,
        status: 'vencido',
      };
    }
    return offer;
  }

  // Obtener todas las ofertas del usuario actual
  getJobOffers(): Observable<JobOffer[]> {
    const userEmailKey = this.getCurrentUserEmailKey();
    return this.getJobOffersByUser(userEmailKey).pipe(
      map(offers => offers.map(offer => this.updateExpiredStatus(offer)))
    );
  }

  // Obtener ofertas por usuario (método interno)
  private getJobOffersByUser(userEmailKey: string, status?: 'all' | 'published' | 'draft' | 'expired'): Observable<JobOffer[]> {
    const userJobOffersRef = this.firebaseService.getDatabaseRef(
      `cv-app/users/${userEmailKey}/job-offer`
    );
    
    return from(this.firebaseService.getDatabaseValue(userJobOffersRef)).pipe(
      map((snapshot: DataSnapshot) => {
        const jobOffers: JobOffer[] = [];
        if (snapshot.exists()) {
          snapshot.forEach((childSnapshot: any) => {
            const jobData = childSnapshot.val();
            const jobOffer = this.mapJobOffer(childSnapshot.key, jobData);
            
            // Aplicar filtro de estado si se especificó
            if (!status || status === 'all' || this.doesOfferMatchStatus(jobOffer, status)) {
              jobOffers.push(jobOffer);
            }
          });
        }
        return jobOffers;
      }),
      catchError(error => {
        console.error('Error al obtener ofertas:', error);
        return throwError(() => new Error('Error al obtener ofertas'));
      })
    );
  }

  // Obtener ofertas por empresa con filtro de estado
  getJobOffersByCompany(companyEmailKey: string, status?: 'all' | 'published' | 'draft' | 'expired'): Observable<JobOffer[]> {
    return this.getJobOffersByUser(companyEmailKey, status).pipe(
      switchMap(jobOffers => {
        // Convertir la promesa a observable
        return from(this.getCompanyName(companyEmailKey)).pipe(
          map(companyName => {
            // Actualizar cada oferta con el nombre de la empresa y verificar vencimiento
            return jobOffers.map(job => 
              this.updateExpiredStatus({
                ...job,
                companyName
              })
            );
          })
        );
      }),
      map(offers => 
        [...offers].sort((a, b) => {
          const dateA = a.publicationDate ? new Date(a.publicationDate).getTime() : 0;
          const dateB = b.publicationDate ? new Date(b.publicationDate).getTime() : 0;
          return dateB - dateA;
        })
      )
    );
  }

  // Verificar si una oferta coincide con el estado especificado
  private doesOfferMatchStatus(offer: JobOffer, status: string): boolean {
    // Primero actualizamos el estado de vencimiento si es necesario
    const updatedOffer = this.updateExpiredStatus(offer);
    
    switch (status) {
      case 'published':
        // Solo mostrar ofertas con estado 'publicado' y que no estén vencidas
        return updatedOffer.status === 'publicado';
      case 'draft':
        // Mostrar solo borradores
        return updatedOffer.status === 'borrador';
      case 'expired':
        // Mostrar ofertas vencidas o canceladas
        return updatedOffer.status === 'vencido' || updatedOffer.status === 'cancelado';
      default:
        // 'all' o cualquier otro valor: mostrar todo
        return true;
    }
  }

  // Obtener una oferta por ID
  getJobOfferById(jobId: string): Observable<JobOffer | undefined> {
    const userEmailKey = this.getCurrentUserEmailKey();
    const jobOfferRef = this.firebaseService.getDatabaseRef(
      `cv-app/users/${userEmailKey}/job-offer/${jobId}`
    );
    
    return from(this.firebaseService.getDatabaseValue(jobOfferRef)).pipe(
      map(jobData => {
        if (!jobData) return undefined;
        const jobOffer = this.mapJobOffer(jobId, jobData);
        return this.updateExpiredStatus(jobOffer);
      }),
      catchError(error => {
        console.error(`Error al obtener oferta ${jobId}:`, error);
        return throwError(() => new Error(`Error al obtener oferta ${jobId}`));
      })
    );
  }

  // Actualizar una oferta de trabajo
  updateJobOffer(jobId: string, jobOffer: Partial<JobOffer>): Observable<void> {
    const userEmailKey = this.getCurrentUserEmailKey();
    const jobOfferRef = this.firebaseService.getDatabaseRef(
      `cv-app/users/${userEmailKey}/job-offer/${jobId}`
    );
    
    // Primero obtener la oferta actual
    return from(this.firebaseService.getDatabaseValue(jobOfferRef)).pipe(
      switchMap((snapshot: DataSnapshot) => {
        if (!snapshot.exists()) {
          return throwError(() => new Error(`No se encontró la oferta con ID ${jobId}`));
        }
        
        // Obtener los datos actuales y asegurar que las fechas sean objetos Date
        const currentData = snapshot.val();
        
        // Convertir las fechas de string a Date si es necesario
        if (currentData.createdAt && typeof currentData.createdAt === 'string') {
          currentData.createdAt = new Date(currentData.createdAt);
        }
        if (currentData.updatedAt && typeof currentData.updatedAt === 'string') {
          currentData.updatedAt = new Date(currentData.updatedAt);
        }
        if (currentData.publicationDate && typeof currentData.publicationDate === 'string') {
          currentData.publicationDate = new Date(currentData.publicationDate).toISOString();
        }
        
        // Crear un objeto con solo los campos que no son undefined
        const cleanJobOffer = Object.entries(jobOffer).reduce((acc, [key, value]) => {
          if (value !== undefined) {
            // Convertir fechas de string a Date si es necesario
            if ((key === 'createdAt' || key === 'updatedAt') && typeof value === 'string') {
              acc[key] = new Date(value);
            } else if (key === 'publicationDate' && value) {
              acc[key] = new Date(value as string).toISOString();
            } else {
              acc[key] = value;
            }
          }
          return acc;
        }, {} as Record<string, any>);
        
        // Crear el objeto actualizado
        const updatedJobOffer: JobOffer = {
          ...currentData,
          ...cleanJobOffer,
          id: jobId, // Asegurar que el ID no se sobrescriba
          updatedAt: new Date()
        };
        
        // Crear un objeto para Firebase convirtiendo las fechas a strings ISO
        const firebaseData: Record<string, any> = {};
        
        Object.entries(updatedJobOffer).forEach(([key, value]) => {
          if (value === undefined) return;
          
          if (value instanceof Date) {
            firebaseData[key] = value.toISOString();
          } else if (key === 'publicationDate' && value) {
            firebaseData[key] = new Date(value).toISOString();
          } else {
            firebaseData[key] = value;
          }
        });
        
        // Guardar la oferta actualizada
        return from(this.firebaseService.setDatabaseValue(jobOfferRef, firebaseData));
      }),
      catchError(error => {
        console.error(`Error al actualizar oferta ${jobId}:`, error);
        return throwError(() => new Error(`Error al actualizar oferta ${jobId}: ${error.message || error}`));
      })
    );
  }

  // Eliminar una oferta de trabajo
  deleteJobOffer(jobId: string): Observable<void> {
    const userEmailKey = this.getCurrentUserEmailKey();
    const jobOfferRef = this.firebaseService.getDatabaseRef(
      `cv-app/users/${userEmailKey}/job-offer/${jobId}`
    );
    
    return from(
      this.firebaseService.setDatabaseValue(jobOfferRef, null)
    ).pipe(
      catchError(error => {
        console.error(`Error al eliminar oferta ${jobId}:`, error);
        return throwError(() => new Error(`Error al eliminar oferta ${jobId}`));
      })
    );
  }

  // Publicar una oferta de trabajo
  publishJobOffer(jobId: string): Observable<void> {
    const userEmailKey = this.getCurrentUserEmailKey();
    const jobOfferRef = this.firebaseService.getDatabaseRef(
      `cv-app/users/${userEmailKey}/job-offer/${jobId}`
    );

    // Obtener la oferta actual primero
    return from(this.firebaseService.getDatabaseValue(jobOfferRef)).pipe(
      switchMap((snapshot: DataSnapshot) => {
        if (!snapshot.exists()) {
          return throwError(() => new Error('La oferta no existe'));
        }

        const jobOffer = { ...snapshot.val() };
        const now = new Date();
        
        // Si no hay fecha límite, establecer una por defecto (30 días a partir de ahora)
        if (!jobOffer.deadline) {
          const defaultDeadline = new Date();
          defaultDeadline.setDate(now.getDate() + 30);
          jobOffer.deadline = defaultDeadline.toISOString();
        } else {
          // Validar que falten al menos 24 horas para la fecha de vencimiento
          const deadlineDate = new Date(jobOffer.deadline);
          const timeDiff = deadlineDate.getTime() - now.getTime();
          const hoursDiff = timeDiff / (1000 * 60 * 60); // Convertir a horas
          
          if (hoursDiff < 24) {
            return throwError(() => new Error('La fecha de vencimiento debe ser al menos 24 horas después de la fecha actual'));
          }
        }

        // Actualizar solo los campos necesarios
        const updatedJobOffer = {
          ...jobOffer,
          status: 'publicado',
          publicationDate: now.toISOString(),
          updatedAt: new Date().toISOString(),
        };

        // Aplicar actualizaciones
        return from(
          this.firebaseService.setDatabaseValue(jobOfferRef, updatedJobOffer)
        );
      }),
      catchError(error => {
        console.error(`Error al publicar oferta ${jobId}:`, error);
        return throwError(() => new Error(`Error al publicar oferta: ${error.message || 'Error desconocido'}`));
      })
    );
  }

  // Cancelar la publicación de una oferta de trabajo
  cancelJobOffer(jobId: string): Observable<void> {
    const userEmailKey = this.getCurrentUserEmailKey();
    const jobOfferRef = this.firebaseService.getDatabaseRef(
      `cv-app/users/${userEmailKey}/job-offer/${jobId}`
    );

    // Obtener la oferta actual primero
    return from(this.firebaseService.getDatabaseValue(jobOfferRef)).pipe(
      switchMap((snapshot: DataSnapshot) => {
        if (!snapshot.exists()) {
          return throwError(() => new Error('La oferta no existe'));
        }

        const jobOffer = { ...snapshot.val() };

        // Actualizar solo los campos necesarios
        const updatedJobOffer = {
          ...jobOffer,
          status: 'cancelado',
          updatedAt: new Date().toISOString(),
        };

        // Aplicar actualizaciones
        return from(
          this.firebaseService.setDatabaseValue(jobOfferRef, updatedJobOffer)
        );
      }),
      catchError(error => {
        console.error(`Error al cancelar oferta ${jobId}:`, error);
        return throwError(() => new Error(`Error al cancelar oferta: ${error.message || 'Error desconocido'}`));
      })
    );
  }

  // Método para obtener el nombre de la empresa
  async getCompanyName(userEmailKey: string): Promise<string> {
    return runInInjectionContext(this.injector, async () => {
      const userRef = ref(this.database, `cv-app/users/${userEmailKey}/profileData/personalData`);
      const snapshot = await get(userRef);
      return snapshot.exists() ? snapshot.val().fullName : '';
    });
  }

  // Método auxiliar para mapear datos de oferta
  private mapJobOffer(id: string, jobData: any): JobOffer {
    return {
      ...jobData,
      id,
      status: jobData.status || 'borrador', // Valor por defecto 'borrador' si no existe
      createdAt: jobData.createdAt ? new Date(jobData.createdAt) : new Date(),
      updatedAt: jobData.updatedAt ? new Date(jobData.updatedAt) : new Date(),
      deadline: jobData.deadline,
      publicationDate: jobData.publicationDate || undefined,
      companyName: jobData.companyName || '',
    } as JobOffer; // Asegurar que el objeto cumple con la interfaz JobOffer
  }
}