import { EnvironmentInjector, Injectable, inject, runInInjectionContext } from '@angular/core';
import { JobOffer } from './job-offer.model';
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
  private db = inject(Database);
  private injector = inject(EnvironmentInjector);

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
      const jobOffersRef = ref(this.db, `cv-app/users/${userEmailKey}/job-offer`);
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
    
    return from(this.getNextAvailableJobId(userEmailKey)).pipe(
      switchMap(nextId => {
        const newJobOffer: JobOffer = {
          ...jobOffer,
          id: nextId,
          applicants: [],
          views: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
          deadline: jobOffer.deadline,
          companyId: userEmailKey,
          companyName: '',
          createdBy: userEmailKey
        };

        const jobOfferRef = this.firebaseService.getDatabaseRef(
          `cv-app/users/${userEmailKey}/job-offer/${nextId}`
        );
        
        return from(this.firebaseService.setDatabaseValue(jobOfferRef, newJobOffer)).pipe(
          map(() => nextId)
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
        isActive: false
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
  private getJobOffersByUser(userEmailKey: string): Observable<JobOffer[]> {
    const userJobOffersRef = this.firebaseService.getDatabaseRef(
      `cv-app/users/${userEmailKey}/job-offer`
    );
    
    return from(this.firebaseService.getDatabaseValue(userJobOffersRef)).pipe(
      map((snapshot: DataSnapshot) => {
        const jobOffers: JobOffer[] = [];
        if (snapshot.exists()) {
          snapshot.forEach((childSnapshot: any) => {
            const jobData = childSnapshot.val();
            jobOffers.push(this.mapJobOffer(childSnapshot.key, jobData));
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

  // Obtener ofertas por empresa (alias para getJobOffersByUser)
  getJobOffersByCompany(companyEmailKey: string): Observable<JobOffer[]> {
    return this.getJobOffersByUser(companyEmailKey).pipe(
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
    
    const updatedJobOffer: Partial<JobOffer> = {
      ...jobOffer,
      updatedAt: new Date()
    };

    return from(
      this.firebaseService.setDatabaseValue(jobOfferRef, updatedJobOffer)
    ).pipe(
      catchError(error => {
        console.error(`Error al actualizar oferta ${jobId}:`, error);
        return throwError(() => new Error(`Error al actualizar oferta ${jobId}`));
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
        }

        // Actualizar solo los campos necesarios
        const updatedJobOffer = {
          ...jobOffer,
          status: 'publicado',
          publicationDate: now.toISOString(),
          updatedAt: new Date().toISOString(),
          isActive: true
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

  // Método para obtener el nombre de la empresa
  private async getCompanyName(userEmailKey: string): Promise<string> {
    return runInInjectionContext(this.injector, async () => {
      const userRef = ref(this.db, `cv-app/users/${userEmailKey}/profileData/personalData`);
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
      isActive: jobData.isActive !== undefined ? jobData.isActive : true // Valor por defecto true si no existe
    } as JobOffer; // Asegurar que el objeto cumple con la interfaz JobOffer
  }
}