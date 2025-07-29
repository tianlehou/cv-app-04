import { Injectable } from '@angular/core';
import { JobOfferService } from 'src/app/pages/users/business/sections/business-publication/job-offer.service';
import { JobOffer } from 'src/app/pages/users/business/sections/business-publication/job-offer.model';
import { Observable, forkJoin, from, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { Database, get, ref, update } from '@angular/fire/database';

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
  getAllPublicJobOffers(currentUserEmail?: string): Observable<JobOffer[]> {
    // Obtemos todas las ofertas de trabajo de todas las empresas
    return this.getAllJobOffers().pipe(
      switchMap(offers => {
        // Si no hay ofertas, retornar un array vacío
        if (!offers || offers.length === 0) {
          return of([]);
        }

        // Si no hay email de usuario autenticado, retornar las ofertas sin verificar likes
        if (!currentUserEmail) {
          return of(offers);
        }

        // Formatear el email para usarlo como clave
        const emailKey = currentUserEmail.replace(/[.#$\[\]]/g, '_');
        
        // Para cada oferta, verificar si el usuario actual le dio like
        const offersWithLikes = offers.map(offer => {
          const userLikesRef = ref(this.database, `cv-app/users/${offer.companyId}/job-offer/${offer.id}/likedBy/${emailKey}`);
          
          return from(get(userLikesRef)).pipe(
            map(snapshot => ({
              ...offer,
              userLiked: snapshot.exists() && snapshot.val() === true
            }))
          );
        });

        return forkJoin(offersWithLikes);
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
              
              const jobPromises: Promise<JobOffer>[] = [];
              
              // Convertir el snapshot en un array para iterar
              const jobOffers: any[] = [];
              jobSnapshot.forEach((child: any) => {
                jobOffers.push(child);
                return false; // Necesario para el tipo de retorno de forEach de Firebase
              });
              
              // Procesar cada oferta
              for (const childSnapshot of jobOffers) {
                const jobData = childSnapshot.val();
                
                // Verificar si el usuario actual dio like a esta oferta
                const userLikedPromise = userId 
                  ? from(get(ref(this.database, `cv-app/users/${companyId}/job-offer/${childSnapshot.key}/likedBy/${userId}`))).toPromise()
                      .then(likeSnapshot => likeSnapshot?.exists() && likeSnapshot.val() === true)
                      .catch(() => false)
                  : Promise.resolve(false);
                
                const jobPromise = userLikedPromise.then(userLiked => {
                  // Mapear los datos de la oferta al modelo JobOffer
                  const jobOffer: JobOffer = {
                    id: childSnapshot.key,
                    ...jobData,
                    // Asegurarse de que los campos opcionales estén definidos
                    companyName: jobData.companyName || 'Empresa no especificada',
                    status: jobData.status || 'borrador',
                    companyId: companyId,
                    userLiked: userLiked,
                    // Agregar más campos según sea necesario
                  };
                  
                  return jobOffer;
                });
                
                jobPromises.push(jobPromise);
              }
              
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

  // Método para actualizar el contador de likes de una oferta de trabajo
  updateJobOfferLikes(jobOfferId: string, companyId: string, userEmail: string, increment: boolean = true): Observable<{success: boolean, alreadyLiked?: boolean}> {
    if (!jobOfferId || !userEmail || !companyId) {
      console.error('Se requiere el ID de la oferta, el ID de la compañía y el email del usuario');
      return of({success: false});
    }

    // Formatear el email para usarlo como clave
    const emailKey = userEmail.replace(/[.#$\[\]]/g, '_');
    
    // Referencia a la oferta de trabajo específica
    const jobOfferRef = ref(this.database, `cv-app/users/${companyId}/job-offer/${jobOfferId}`);
    // Referencia para rastrear qué usuarios han dado like (usando email como clave)
    const userLikesRef = ref(this.database, `cv-app/users/${companyId}/job-offer/${jobOfferId}/likedBy/${emailKey}`);
    
    return from(get(userLikesRef)).pipe(
      switchMap((userLikeSnapshot) => {
        const userAlreadyLiked = userLikeSnapshot.exists() && userLikeSnapshot.val() === true;
        
        // Si el usuario ya dio like y está intentando dar like de nuevo, o
        // si está intentando quitar like pero no lo había dado
        if ((increment && userAlreadyLiked) || (!increment && !userAlreadyLiked)) {
          return of({success: false, alreadyLiked: userAlreadyLiked});
        }
        
        // Obtener la oferta para actualizar el contador
        return from(get(jobOfferRef)).pipe(
          switchMap((snapshot) => {
            if (!snapshot.exists()) {
              console.error('No se encontró la oferta de trabajo');
              return of({success: false});
            }

            const jobOffer = snapshot.val();
            const currentLikes = jobOffer.likes || 0;
            const newLikes = increment ? currentLikes + 1 : Math.max(0, currentLikes - 1);

            // Preparar las actualizaciones atómicas
            const updates: any = {};
            
            // Actualizar el contador de likes
            updates[`cv-app/users/${companyId}/job-offer/${jobOfferId}/likes`] = newLikes;
            updates[`cv-app/users/${companyId}/job-offer/${jobOfferId}/updatedAt`] = new Date().toISOString();
            
            // Actualizar el registro de likes del usuario (usando email como clave)
            if (increment) {
              updates[`cv-app/users/${companyId}/job-offer/${jobOfferId}/likedBy/${emailKey}`] = true;
            } else {
              updates[`cv-app/users/${companyId}/job-offer/${jobOfferId}/likedBy/${emailKey}`] = null; // Eliminar la entrada
            }

            // Ejecutar todas las actualizaciones de forma atómica
            return from(update(ref(this.database), updates)).pipe(
              map(() => ({success: true})),
              catchError(error => {
                console.error('Error al actualizar los likes:', error);
                return of({success: false});
              })
            );
          })
        );
      }),
      catchError(error => {
        console.error('Error al verificar el estado del like:', error);
        return of({success: false});
      })
    );
  }
}
