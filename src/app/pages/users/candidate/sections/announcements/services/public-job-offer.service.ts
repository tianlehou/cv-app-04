import { Injectable, runInInjectionContext } from '@angular/core';
import { JobOfferService } from 'src/app/pages/users/business/sections/business-publication/services/job-offer.service';
import { JobOffer } from 'src/app/pages/users/business/sections/business-publication/job-offer.model';
import { Observable, forkJoin, from, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { get, ref } from '@angular/fire/database';

@Injectable({
  providedIn: 'root'
})
export class PublicJobOfferService extends JobOfferService {

  // Método para verificar si una oferta está vencida
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
      return false;
    }
  }

  // Método para obtener todas las ofertas de trabajo públicas de todas las empresas
  getAllPublicJobOffers(currentUserEmail?: string): Observable<JobOffer[]> {
    return runInInjectionContext(this.injector, () => {
      return this.getAllJobOffers().pipe(
        switchMap(offers => {
          if (!offers || offers.length === 0) {
            return of([]);
          }

          if (!currentUserEmail) {
            return of(offers);
          }

          const emailKey = currentUserEmail.replace(/[.#$\[\]]/g, '_');

          const offersWithUserStatus = offers.map(offer => {
            return runInInjectionContext(this.injector, () => {
              const userLikesRef = ref(this.database, `cv-app/users/${offer.companyId}/job-offer/${offer.id}/likedBy/${emailKey}`);
              const userSavesRef = ref(this.database, `cv-app/users/${offer.companyId}/job-offer/${offer.id}/savedBy/${emailKey}`);

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
          });

          return forkJoin(offersWithUserStatus);
        })
      );
    });
  }

  // Método para obtener todas las ofertas de trabajo públicas de todas las empresas
  getAllJobOffers(userId?: string): Observable<JobOffer[]> {
    return runInInjectionContext(this.injector, () => {
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

          const jobOffersObservables = userKeys.map(companyId => {
            return runInInjectionContext(this.injector, () => {
              const userJobOffersRef = ref(this.database, `cv-app/users/${companyId}/job-offer`);

              return from(get(userJobOffersRef)).pipe(
                switchMap((jobSnapshot) => {
                  if (!jobSnapshot.exists()) {
                    return of([]);
                  }

                  const jobPromises: Promise<JobOffer>[] = [];
                  jobSnapshot.forEach((child: any) => {
                    const jobData = child.val();
                    const jobId = child.key;

                    const jobPromise = runInInjectionContext(this.injector, async () => {
                      let likeSnapshot = null;
                      let saveSnapshot = null;

                      if (userId) {
                        const formattedUserId = userId.replace(/[.#$\[\]]/g, '_');
                        [likeSnapshot, saveSnapshot] = await Promise.all([
                          get(ref(this.database, `cv-app/users/${companyId}/job-offer/${jobId}/likedBy/${formattedUserId}`)),
                          get(ref(this.database, `cv-app/users/${companyId}/job-offer/${jobId}/savedBy/${formattedUserId}`))
                        ]);
                      }

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
          });

          return forkJoin(jobOffersObservables).pipe(
            map(jobOffersArray => {
              const allOffers = jobOffersArray.flat();
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
    });
  }
}