import { Injectable, inject } from '@angular/core';
import { JobOffer } from './job-offer.model';
import { Observable, from, throwError } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { FirebaseService } from 'src/app/shared/services/firebase.service';
import { DataSnapshot } from '@angular/fire/database';

@Injectable({
  providedIn: 'root'
})
export class JobOfferService {
  private readonly DB_PATH = 'jobOffers';
  private firebaseService = inject(FirebaseService);

  // Crear una nueva oferta de trabajo
  createJobOffer(jobOffer: Omit<JobOffer, 'id'>): Observable<string> {
    const id = this.firebaseService.generateUserId();
    const newJobOffer: JobOffer = {
      ...jobOffer,
      id,
      applicants: [],
      views: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      // Asegurar que las fechas de publicación y vencimiento estén en el formato correcto
      deadline: jobOffer.deadline,
      publicationDate: new Date().toISOString()
    };

    const jobOfferRef = this.firebaseService.getDatabaseRef(`${this.DB_PATH}/${id}`);
    return from(
      this.firebaseService.setDatabaseValue(jobOfferRef, newJobOffer)
    ).pipe(
      map(() => id),
      catchError(error => {
        console.error('Error al crear la oferta de trabajo:', error);
        return throwError(() => new Error('Error al crear la oferta de trabajo'));
      })
    );
  }

  // Obtener todas las ofertas de trabajo
  getJobOffers(): Observable<JobOffer[]> {
    const jobOffersRef = this.firebaseService.getDatabaseRef(this.DB_PATH);
    return from(this.firebaseService.getDatabaseValue(jobOffersRef)).pipe(
      map((snapshot: DataSnapshot) => {
        const jobOffers: JobOffer[] = [];
        if (snapshot.exists()) {
          snapshot.forEach((childSnapshot: any) => {
            const jobData = childSnapshot.val();
            // Convertir las fechas de string a Date si es necesario
            const jobOffer: JobOffer = {
              ...jobData,
              id: childSnapshot.key!,
              createdAt: jobData.createdAt ? new Date(jobData.createdAt) : new Date(),
              updatedAt: jobData.updatedAt ? new Date(jobData.updatedAt) : new Date(),
              deadline: jobData.deadline,
              publicationDate: jobData.publicationDate
            };
            jobOffers.push(jobOffer);
          });
        }
        return jobOffers;
      }),
      catchError(error => {
        console.error('Error al obtener las ofertas de trabajo:', error);
        return throwError(() => new Error('Error al obtener las ofertas de trabajo'));
      })
    );
  }

  // Obtener una oferta por ID
  getJobOfferById(id: string): Observable<JobOffer | undefined> {
    const jobOfferRef = this.firebaseService.getDatabaseRef(`${this.DB_PATH}/${id}`);
    return from(this.firebaseService.getDatabaseValue(jobOfferRef)).pipe(
      map((snapshot: DataSnapshot) => {
        if (!snapshot.exists()) return undefined;
        const jobData = snapshot.val();
        return {
          ...jobData,
          id,
          createdAt: jobData.createdAt ? new Date(jobData.createdAt) : new Date(),
          updatedAt: jobData.updatedAt ? new Date(jobData.updatedAt) : new Date(),
          deadline: jobData.deadline,
          publicationDate: jobData.publicationDate
        } as JobOffer;
      }),
      catchError(error => {
        console.error(`Error al obtener la oferta con ID ${id}:`, error);
        return throwError(() => new Error(`Error al obtener la oferta con ID ${id}`));
      })
    );
  }

  // Actualizar una oferta de trabajo
  updateJobOffer(id: string, jobOffer: Partial<JobOffer>): Observable<void> {
    const jobOfferRef = this.firebaseService.getDatabaseRef(`${this.DB_PATH}/${id}`);
    const updatedJobOffer: Partial<JobOffer> = {
      ...jobOffer,
      updatedAt: new Date()
    };

    return from(
      this.firebaseService.setDatabaseValue(jobOfferRef, updatedJobOffer)
    ).pipe(
      catchError(error => {
        console.error(`Error al actualizar la oferta con ID ${id}:`, error);
        return throwError(() => new Error(`Error al actualizar la oferta con ID ${id}`));
      })
    );
  }

  // Eliminar una oferta de trabajo
  deleteJobOffer(id: string): Observable<void> {
    const jobOfferRef = this.firebaseService.getDatabaseRef(`${this.DB_PATH}/${id}`);
    return from(
      this.firebaseService.setDatabaseValue(jobOfferRef, null)
    ).pipe(
      catchError(error => {
        console.error(`Error al eliminar la oferta con ID ${id}:`, error);
        return throwError(() => new Error(`Error al eliminar la oferta con ID ${id}`));
      })
    );
  }

  // Obtener ofertas por empresa
  getJobOffersByCompany(companyId: string): Observable<JobOffer[]> {
    return this.getJobOffers().pipe(
      map(jobOffers => 
        jobOffers
          .filter(job => job.companyId === companyId)
          .sort((a, b) => 
            new Date(b.publicationDate).getTime() - new Date(a.publicationDate).getTime()
          )
      ),
      catchError(error => {
        console.error(`Error al obtener las ofertas para la empresa ${companyId}:`, error);
        return throwError(() => new Error(`Error al obtener las ofertas para la empresa ${companyId}`));
      })
    );
  }

  // Incrementar el contador de visualizaciones
  incrementViewCount(jobId: string): Observable<void> {
    const jobRef = this.firebaseService.getDatabaseRef(`${this.DB_PATH}/${jobId}/views`);
    
    return from(this.firebaseService.getDatabaseValue(jobRef)).pipe(
      switchMap((snapshot: DataSnapshot) => {
        const currentViews = snapshot.val() || 0;
        return from(this.firebaseService.setDatabaseValue(jobRef, currentViews + 1));
      }),
      catchError(error => {
        console.error(`Error al incrementar las visualizaciones de la oferta ${jobId}:`, error);
        return throwError(() => new Error('Error al actualizar el contador de visualizaciones'));
      })
    );
  }
}
