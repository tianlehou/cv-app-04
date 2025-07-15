import { Injectable, inject } from '@angular/core';
import { JobOffer } from './job-offer.model';
import { Observable, from, throwError } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { FirebaseService } from 'src/app/shared/services/firebase.service';
import { DataSnapshot } from '@angular/fire/database';
import { AuthService } from 'src/app/pages/home/auth/auth.service';

@Injectable({
  providedIn: 'root'
})
export class JobOfferService {
  private firebaseService = inject(FirebaseService);
  private authService = inject(AuthService);

  // Método para obtener el userEmailKey del usuario actual
  private getCurrentUserEmailKey(): string {
    const currentUser = this.authService.getCurrentAuthUser();
    if (!currentUser || !currentUser.email) {
      throw new Error('Usuario no autenticado');
    }
    return this.firebaseService.formatEmailKey(currentUser.email);
  }

  // Crear una nueva oferta de trabajo
  createJobOffer(jobOffer: Omit<JobOffer, 'id'>): Observable<string> {
    const userEmailKey = this.getCurrentUserEmailKey();
    const userJobOffersRef = this.firebaseService.getDatabaseRef(`cv-app/users/${userEmailKey}/job-offer`);

    return from(this.firebaseService.getDatabaseValue(userJobOffersRef)).pipe(
      switchMap((snapshot: DataSnapshot) => {
        // Generar ID incremental
        let nextId = '0001';
        if (snapshot.exists()) {
          const jobCount = Object.keys(snapshot.val()).length;
          nextId = (jobCount + 1).toString().padStart(4, '0');
        }

        const newJobOffer: JobOffer = {
          ...jobOffer,
          id: nextId,
          applicants: [],
          views: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
          deadline: jobOffer.deadline,
          publicationDate: new Date().toISOString(),
          companyId: userEmailKey,
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

  // Obtener todas las ofertas del usuario actual
  getJobOffers(): Observable<JobOffer[]> {
    const userEmailKey = this.getCurrentUserEmailKey();
    return this.getJobOffersByUser(userEmailKey);
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
      map(jobOffers => 
        jobOffers.sort((a, b) => 
          new Date(b.publicationDate).getTime() - new Date(a.publicationDate).getTime()
        )
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
      map((snapshot: DataSnapshot) => {
        if (!snapshot.exists()) return undefined;
        return this.mapJobOffer(jobId, snapshot.val());
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

  // Método auxiliar para mapear datos de oferta
  private mapJobOffer(id: string, jobData: any): JobOffer {
    return {
      ...jobData,
      id,
      createdAt: jobData.createdAt ? new Date(jobData.createdAt) : new Date(),
      updatedAt: jobData.updatedAt ? new Date(jobData.updatedAt) : new Date(),
      deadline: jobData.deadline,
      publicationDate: jobData.publicationDate
    };
  }
}