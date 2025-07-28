import { Injectable } from '@angular/core';
import { JobOfferService } from 'src/app/pages/users/business/sections/business-publication/job-offer.service';
import { JobOffer } from 'src/app/pages/users/business/sections/business-publication/job-offer.model';
import { Observable, forkJoin, from, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { Database, get, ref } from '@angular/fire/database';

@Injectable({
  providedIn: 'root'
})
export class PublicJobOfferService extends JobOfferService {
  constructor(
    private database: Database
  ) {
    super();
  }

  // Método para obtener todas las ofertas de trabajo públicas de todas las empresas
  getAllPublicJobOffers(): Observable<JobOffer[]> {
    const usersRef = ref(this.database, 'cv-app/users');
    
    return from(get(usersRef)).pipe(
      switchMap((snapshot) => {
        if (!snapshot.exists()) {
          console.log('No se encontraron usuarios en la base de datos');
          return of([]);
        }

        const users = snapshot.val();
        const userKeys = Object.keys(users);
        
        if (userKeys.length === 0) {
          console.log('No hay usuarios en la base de datos');
          return of([]);
        }
        
        // Obtener ofertas de cada usuario
        const jobOffersObservables = userKeys.map(userKey => {
          const userJobOffersRef = ref(this.database, `cv-app/users/${userKey}/job-offer`);

          return from(get(userJobOffersRef)).pipe(
            map((jobSnapshot) => {
              const jobOffers: JobOffer[] = [];
              if (jobSnapshot.exists()) {
                jobSnapshot.forEach((childSnapshot: any) => {
                  const jobData = childSnapshot.val();
                  
                  // Mapear los datos de la oferta al modelo JobOffer
                  const jobOffer: JobOffer = {
                    id: childSnapshot.key,
                    ...jobData,
                    // Asegurarse de que los campos opcionales estén definidos
                    companyName: jobData.companyName || 'Empresa no especificada',
                    status: jobData.status || 'borrador',
                    // Agregar más campos según sea necesario
                  };
                  
                  // Solo incluir ofertas publicadas y no vencidas
                  const isPublished = jobOffer.status === 'publicado';
                  const isExpired = this.isOfferExpiredCheck(jobOffer);
                  if (isPublished && !isExpired) {
                    jobOffers.push(jobOffer);
                  }
                });
              }
              return jobOffers;
            }),
            catchError(error => {
              console.error(`Error al obtener ofertas del usuario ${userKey}:`, error);
              return of([]); // Retornar array vacío en caso de error
            })
          );
        });

        return forkJoin(jobOffersObservables).pipe(
          map(jobOffersArray => {
            const allOffers = jobOffersArray.flat();
            
            // Ordenar por fecha de publicación (más recientes primero)
            const sortedOffers = allOffers.sort((a, b) => {
              const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
              const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
              return dateB - dateA; // Orden descendente (más recientes primero)
            });
            
            return sortedOffers;
          })
        );
      }),
      catchError(error => {
        console.error('Error al obtener usuarios:', error);
        return of([]);
      })
    );
  }
  
  // Método para verificar si una oferta está vencida
  // Usamos un nombre diferente para evitar la colisión con el método privado de la clase padre
  private isOfferExpiredCheck(offer: JobOffer): boolean {
    if (!offer.deadline || offer.status !== 'publicado') {
      return false;
    }
    
    try {
      const deadline = new Date(offer.deadline);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      return deadline < today;
    } catch (error) {
      console.error('Error al verificar si la oferta está vencida:', error);
      return false; // En caso de error, asumir que no está vencida
    }
  }
}
