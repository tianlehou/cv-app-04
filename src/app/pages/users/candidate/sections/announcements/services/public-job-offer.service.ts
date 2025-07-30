import { Injectable } from '@angular/core';
import { JobOfferService } from 'src/app/pages/users/business/sections/business-publication/services/job-offer.service';
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

  // Método para verificar si una oferta está vencida
  // Usamos un nombre diferente para evitar la colisión con el método privado de la clase padre
  isOfferExpiredCheck(offer: JobOffer): boolean {
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

  // Método para obtener todas las ofertas de trabajo públicas de todas las empresas
  getAllPublicJobOffers(currentUserEmail?: string): Observable<JobOffer[]> {
    // Obtemos todas las ofertas de trabajo de todas las empresas
    return this.getAllJobOffers().pipe(
      switchMap(offers => {
        // Si no hay ofertas, retornar un array vacío
        if (!offers || offers.length === 0) {
          return of([]);
        }

        // Si no hay email de usuario autenticado, retornar las ofertas sin verificar likes/saves
        if (!currentUserEmail) {
          return of(offers);
        }

        // Formatear el email para usarlo como clave (una sola vez)
        const emailKey = currentUserEmail.replace(/[.#$\[\]]/g, '_');

        // Combinar las verificaciones de likes y saves en una sola operación por oferta
        const offersWithUserStatus = offers.map(offer => {
          const userLikesRef = ref(this.database, `cv-app/users/${offer.companyId}/job-offer/${offer.id}/likedBy/${emailKey}`);
          const userSavesRef = ref(this.database, `cv-app/users/${offer.companyId}/job-offer/${offer.id}/savedBy/${emailKey}`);

          // Combinar ambas consultas en paralelo
          return forkJoin([
            from(get(userLikesRef)),
            from(get(userSavesRef))
          ]).pipe(
            map(([likeSnapshot, saveSnapshot]) => ({
              ...offer,
              userLiked: likeSnapshot.exists() && likeSnapshot.val() === true,
              userSaved: saveSnapshot.exists() && saveSnapshot.val() === true
            }))
          );
        });

        // Combinar todos los observables de ofertas
        return forkJoin(offersWithUserStatus);
      })
    );
  }

  // Método para obtener todas las ofertas de trabajo públicas de todas las empresas
  getAllJobOffers(userId?: string): Observable<JobOffer[]> {
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
        const jobOffersObservables = userKeys.map(companyId => {
          const userJobOffersRef = ref(this.database, `cv-app/users/${companyId}/job-offer`);

          return from(get(userJobOffersRef)).pipe(
            switchMap((jobSnapshot) => {
              if (!jobSnapshot.exists()) {
                return of([]);
              }

              // Convertir el snapshot en un array de promesas de JobOffer
              const jobPromises: Promise<JobOffer>[] = [];
              jobSnapshot.forEach((child: any) => {
                const jobData = child.val();
                const jobId = child.key;

                // Combinar las verificaciones de like y save en una sola operación
                const userStatusPromises = userId
                  ? Promise.all([
                    from(get(ref(this.database, `cv-app/users/${companyId}/job-offer/${jobId}/likedBy/${userId}`))).toPromise(),
                    from(get(ref(this.database, `cv-app/users/${companyId}/job-offer/${jobId}/savedBy/${userId}`))).toPromise()
                  ])
                  : Promise.resolve([null, null]);

                const jobPromise = userStatusPromises.then(([likeSnapshot, saveSnapshot]) => {
                  return {
                    id: jobId,
                    ...jobData,
                    companyName: jobData.companyName || 'Empresa no especificada',
                    status: jobData.status || 'borrador',
                    companyId: companyId,
                    userLiked: userId ? (likeSnapshot?.exists() && likeSnapshot.val() === true) : false,
                    userSaved: userId ? (saveSnapshot?.exists() && saveSnapshot.val() === true) : false
                  } as JobOffer;
                });

                jobPromises.push(jobPromise);
                return false;
              });

              return Promise.all(jobPromises).then(offers => {
                // Filtrar ofertas publicadas y no vencidas
                return offers.filter(jobOffer => {
                  const isPublished = jobOffer.status === 'publicado';
                  const isExpired = this.isOfferExpiredCheck(jobOffer);
                  return isPublished && !isExpired;
                });
              });
            }),
            catchError(error => {
              console.error(`Error al obtener ofertas del usuario ${companyId}:`, error);
              return of([]);
            })
          );
        });

        return forkJoin(jobOffersObservables).pipe(
          map(jobOffersArray => {
            const allOffers = jobOffersArray.flat();

            // Ordenar por fecha de publicación (más recientes primero)
            return allOffers.sort((a, b) => {
              const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
              const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
              return dateB - dateA;
            });
          })
        );
      }),
      catchError(error => {
        console.error('Error al obtener usuarios:', error);
        return of([]);
      })
    );
  }
}
