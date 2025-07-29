import { Injectable, inject } from '@angular/core';
import { JobOffer } from '../../../../business/sections/business-publication/job-offer.model';
import { PublicJobOfferService } from './public-job-offer.service';
import { catchError, of } from 'rxjs';
import { Auth, User, user } from '@angular/fire/auth';
import { Observable, map } from 'rxjs';

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
  private publicJobOfferService = inject(PublicJobOfferService);
  
  // Almacenar estados de iconos
  private iconStates: IconStates = {};
  private user: User | null = null;

  constructor() {
    // Suscribirse a cambios en el estado de autenticación
    user(this.auth).subscribe((user) => {
      this.user = user;
    });
  }

  /**
   * Alternar el estado de like de una oferta de trabajo
   * @param jobOffer Oferta de trabajo a la que se le dará/quitará like
   * @param iconStates Objeto con los estados actuales de los iconos
   * @returns Un observable que emite el nuevo estado del like o null si hay un error
   */
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
    }, 3000);

    // Llamar al servicio para actualizar los likes
    return this.publicJobOfferService.updateJobOfferLikes(
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

  /**
   * Alternar el estado de un icono
   * @param jobOffer Oferta de trabajo
   * @param iconType Tipo de icono a alternar
   * @param iconStates Objeto con los estados actuales de los iconos
   * @returns Un observable que emite el nuevo estado del icono o null si hay un error
   */
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

  /**
   * Obtener el estado actual de los iconos
   * @param jobOfferId ID de la oferta de trabajo
   * @returns Estado actual de los iconos para la oferta especificada
   */
  getIconState(jobOfferId: string): { heart: boolean; bookmark: boolean; share: boolean } {
    if (!this.iconStates[jobOfferId]) {
      this.iconStates[jobOfferId] = { heart: false, bookmark: false, share: false };
    }
    return this.iconStates[jobOfferId];
  }
}
