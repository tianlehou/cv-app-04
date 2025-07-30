import { Injectable, inject, EnvironmentInjector, runInInjectionContext } from '@angular/core';
import { catchError, from, of, Observable, map, switchMap } from 'rxjs';
import { Auth, User, user } from '@angular/fire/auth';
import { Database, get, ref, update } from '@angular/fire/database';
import { JobOffer } from '../../../../business/sections/business-publication/job-offer.model';

type IconType = 'heart' | 'bookmark' | 'share';
interface IconStates {
  [key: string]: {
    heart: boolean;
    bookmark: boolean;
    share: boolean;
    cooldown?: boolean;
  };
}

@Injectable({
  providedIn: 'root'
})
export class JobInteractionService {
  private auth = inject(Auth);
  private database = inject(Database);
  private injector = inject(EnvironmentInjector);

  // Almacenar estados de iconos
  private iconStates: IconStates = {};
  private user: User | null = null;

  constructor() {
    // Suscribirse a cambios en el estado de autenticación
    user(this.auth).subscribe((user) => {
      this.user = user;
    });
  }

  toggleIcon(
    jobOffer: JobOffer,
    iconType: IconType,
    iconStates: IconStates
  ): Observable<boolean | null> {
    // Manejar el corazón de manera especial
    if (iconType === 'heart') {
      return this.toggleLike(jobOffer, iconStates);
    }

    // Para los demás iconos, mantener el comportamiento actual
    if (iconStates[jobOffer.id || '']) {
      const newState = !iconStates[jobOffer.id || ''][iconType];
      iconStates[jobOffer.id || ''][iconType] = newState;
      return of(newState);
    }

    return of(null);
  }

  getIconState(jobOfferId: string): { heart: boolean; bookmark: boolean; share: boolean } {
    if (!this.iconStates[jobOfferId]) {
      this.iconStates[jobOfferId] = { heart: false, bookmark: false, share: false };
    }
    return this.iconStates[jobOfferId];
  }

  toggleLike(jobOffer: JobOffer, iconStates: IconStates): Observable<boolean | null> {
    // Verificar si el usuario está autenticado
    if (!this.user?.email) {
      console.warn('Usuario no autenticado');
      return of(null);
    }

    const jobOfferId = jobOffer.id;
    if (!jobOfferId || !jobOffer.companyId) {
      console.error('ID de oferta o compañía no válido');
      return of(null);
    }

    // Inicializar el estado del icono si no existe
    if (!iconStates[jobOfferId]) {
      iconStates[jobOfferId] = { heart: false, bookmark: false, share: false };
    }

    // Si el botón está en cooldown, no hacer nada
    if (iconStates[jobOfferId].cooldown) {
      console.log('Botón en cooldown');
      return of(null);
    }

    // Obtener el estado actual del corazón
    const currentState = iconStates[jobOfferId].heart;
    const newState = !currentState;

    // Iniciar cooldown de 3 segundos
    iconStates[jobOfferId].cooldown = true;
    setTimeout(() => {
      if (iconStates[jobOfferId]) {
        iconStates[jobOfferId].cooldown = false;
      }
    }, 1000);

    // Llamar al servicio para actualizar los likes
    return this.updateJobOfferLikes(
      jobOfferId,
      jobOffer.companyId,
      this.user.email || '',
      newState
    ).pipe(
      map(() => {
        // Actualizar el estado local
        iconStates[jobOfferId].heart = newState;
        return newState;
      }),
      catchError(error => {
        console.error('Error al actualizar like:', error);
        // En caso de error, terminar el cooldown
        iconStates[jobOfferId].cooldown = false;
        return of(currentState);
      })
    );
  }

  toggleSave(jobOffer: JobOffer, iconStates: IconStates): Observable<boolean | null> {
    // Verificar si el usuario está autenticado
    if (!this.user?.email) {
      console.warn('Usuario no autenticado');
      return of(null);
    }

    const jobOfferId = jobOffer.id;
    if (!jobOfferId || !jobOffer.companyId) {
      console.error('ID de oferta o compañía no válido');
      return of(null);
    }

    // Inicializar el estado del icono si no existe
    if (!iconStates[jobOfferId]) {
      iconStates[jobOfferId] = { heart: false, bookmark: false, share: false };
    }

    // Si el botón está en cooldown, no hacer nada
    if (iconStates[jobOfferId].cooldown) {
      console.log('Botón en cooldown');
      return of(null);
    }

    // Obtener el estado actual del bookmark
    const currentState = iconStates[jobOfferId].bookmark;
    const newState = !currentState;

    // Iniciar cooldown de 3 segundos
    iconStates[jobOfferId].cooldown = true;
    setTimeout(() => {
      if (iconStates[jobOfferId]) {
        iconStates[jobOfferId].cooldown = false;
      }
    }, 1000);

    // Llamar al servicio para actualizar los bookmarks
    return this.updateJobOfferSaves(
      jobOfferId,
      jobOffer.companyId,
      this.user.email || '',
      newState
    ).pipe(
      map(() => {
        // Actualizar el estado local
        iconStates[jobOfferId].bookmark = newState;
        return newState;
      }),
      catchError(error => {
        console.error('Error al actualizar bookmark:', error);
        // En caso de error, terminar el cooldown
        iconStates[jobOfferId].cooldown = false;
        return of(currentState);
      })
    );
  }

  // Método para actualizar el contador de likes de una oferta de trabajo
  updateJobOfferLikes(jobOfferId: string, companyId: string, userEmail: string, increment: boolean = true): Observable<{ success: boolean, alreadyLiked?: boolean }> {
    return runInInjectionContext(this.injector, () => {
      if (!jobOfferId || !userEmail || !companyId) {
        console.error('Se requiere el ID de la oferta, el ID de la compañía y el email del usuario');
        return of({ success: false });
      }

      // Formatear el email para usarlo como clave
      const emailKey = userEmail.replace(/[.#\[\]]/g, '_');

      // Referencia a la oferta de trabajo específica
      const jobOfferRef = ref(this.database, `cv-app/users/${companyId}/job-offer/${jobOfferId}`);
      // Referencia para rastrear qué usuarios han dado like (usando email como clave)
      const userLikesRef = ref(this.database, `cv-app/users/${companyId}/job-offer/${jobOfferId}/likedBy/${emailKey}`);

      // Primera operación Firebase (get)
      const getLikes$ = from(runInInjectionContext(this.injector, () => get(userLikesRef)));

      return getLikes$.pipe(
        switchMap((userLikeSnapshot) => {
          const userAlreadyLiked = userLikeSnapshot.exists() && userLikeSnapshot.val() === true;

          if ((increment && userAlreadyLiked) || (!increment && !userAlreadyLiked)) {
            return of({ success: false, alreadyLiked: userAlreadyLiked });
          }

          // Segunda operación Firebase (get)
          const getJobOffer$ = from(runInInjectionContext(this.injector, () => get(jobOfferRef)));

          return getJobOffer$.pipe(
            switchMap((jobOfferSnapshot) => {
              if (!jobOfferSnapshot.exists()) {
                console.error('La oferta de trabajo no existe');
                return of({ success: false });
              }

              const jobOffer = jobOfferSnapshot.val();
              const currentLikes = jobOffer.likes || 0;
              const newLikes = increment ? currentLikes + 1 : currentLikes - 1;

              // Actualizar el contador de likes y el estado del like del usuario en una sola operación
              const updates: any = {};
              updates[`cv-app/users/${companyId}/job-offer/${jobOfferId}/likes`] = newLikes;
              updates[`cv-app/users/${companyId}/job-offer/${jobOfferId}/likedBy/${emailKey}`] = increment;

              // Tercera operación Firebase (update)
              const update$ = from(runInInjectionContext(this.injector, () => update(ref(this.database), updates)));

              return update$.pipe(
                map(() => ({ success: true })),
                catchError(error => {
                  console.error('Error al actualizar likes:', error);
                  return of({ success: false });
                })
              );
            })
          );
        })
      );
    });
  }

  // Método para actualizar los bookmarks de una oferta de trabajo
  updateJobOfferSaves(jobOfferId: string, companyId: string, userEmail: string, addBookmark: boolean = true): Observable<{ success: boolean, alreadyBookmarked?: boolean }> {
    return runInInjectionContext(this.injector, () => {
      if (!jobOfferId || !userEmail || !companyId) {
        console.error('Se requiere el ID de la oferta, el ID de la compañía y el email del usuario');
        return of({ success: false });
      }

      // Formatear el email para usarlo como clave
      const emailKey = userEmail.replace(/[.#\[\]]/g, '_');

      // Referencia a la oferta de trabajo específica
      const jobOfferRef = ref(this.database, `cv-app/users/${companyId}/job-offer/${jobOfferId}`);
      // Referencia para rastrear qué usuarios han guardado la oferta (usando email como clave)
      const userBookmarksRef = ref(this.database, `cv-app/users/${companyId}/job-offer/${jobOfferId}/savedBy/${emailKey}`);

      // Primera operación Firebase (get)
      const getBookmarks$ = from(runInInjectionContext(this.injector, () => get(userBookmarksRef)));

      return getBookmarks$.pipe(
        switchMap((userBookmarkSnapshot) => {
          const userAlreadyBookmarked = userBookmarkSnapshot.exists() && userBookmarkSnapshot.val() === true;

          if ((addBookmark && userAlreadyBookmarked) || (!addBookmark && !userAlreadyBookmarked)) {
            return of({ success: false, alreadyBookmarked: userAlreadyBookmarked });
          }

          // Segunda operación Firebase (get)
          const getJobOffer$ = from(runInInjectionContext(this.injector, () => get(jobOfferRef)));

          return getJobOffer$.pipe(
            switchMap((jobOfferSnapshot) => {
              if (!jobOfferSnapshot.exists()) {
                console.error('La oferta de trabajo no existe');
                return of({ success: false });
              }

              const jobOffer = jobOfferSnapshot.val();
              const currentSaves = jobOffer.saves || 0;
              const newSaves = addBookmark ? currentSaves + 1 : Math.max(0, currentSaves - 1);

              // Actualizar el contador de guardados y el estado del guardado del usuario en una sola operación
              const updates: any = {};
              updates[`cv-app/users/${companyId}/job-offer/${jobOfferId}/saves`] = newSaves;
              updates[`cv-app/users/${companyId}/job-offer/${jobOfferId}/savedBy/${emailKey}`] = addBookmark;

              // Tercera operación Firebase (update)
              const update$ = from(runInInjectionContext(this.injector, () => update(ref(this.database), updates)));

              return update$.pipe(
                map(() => ({ success: true })),
                catchError(error => {
                  console.error('Error al actualizar bookmarks:', error);
                  return of({ success: false });
                })
              );
            })
          );
        }),
        catchError(error => {
          console.error('Error al verificar el estado del bookmark:', error);
          return of({ success: false });
        })
      );
    });
  }
}
