import { Injectable, inject } from '@angular/core';
import { Database, get, ref, query, orderByChild, equalTo } from '@angular/fire/database';
import { Observable, from, of } from 'rxjs';
import { map, switchMap, catchError } from 'rxjs/operators';
import { Auth } from '@angular/fire/auth';
import { FirebaseService } from 'src/app/shared/services/firebase.service';

@Injectable({
  providedIn: 'root'
})
export class ApplicantsService {
  private database = inject(Database);
  private auth = inject(Auth);
  private firebaseService = inject(FirebaseService);

  /**
   * Obtiene los postulantes a una oferta de trabajo
   * @param jobOfferId ID de la oferta de trabajo
   * @param companyId ID de la compañía que publicó la oferta
   */
  getApplicants(jobOfferId: string, companyId: string): Observable<any[]> {
    if (!jobOfferId || !companyId) {
      console.error('Se requiere el ID de la oferta y el ID de la compañía');
      return of([]);
    }

    // Referencia a los aplicantes de la oferta
    const applicantsRef = ref(this.database, `cv-app/users/${companyId}/job-offer/${jobOfferId}/appliedBy`);
    
    return from(get(applicantsRef)).pipe(
      switchMap((snapshot) => {
        if (!snapshot.exists()) {
          return of([]); // No hay aplicantes
        }

        const applicantsData = snapshot.val();
        const applicants = [];
        const userPromises = [];

        // Obtener los datos de cada usuario que aplicó
        for (const [emailKey] of Object.entries(applicantsData)) {
          if (applicantsData[emailKey] === true) {
            // Convertir la clave de email de nuevo al formato original
            const userEmail = emailKey.replace(/_/g, '.');
            // Buscar el perfil del usuario por email
            userPromises.push(this.getUserProfileByEmail(userEmail));
          }
        }

        // Esperar a que todas las promesas se resuelvan
        return Promise.all(userPromises);
      }),
      catchError(error => {
        console.error('Error al obtener los postulantes:', error);
        return of([]);
      })
    );
  }

  private async getUserProfileByEmail(email: string): Promise<any> {
    try {
      const emailKey = this.firebaseService.formatEmailKey(email);
      const userRef = ref(this.database, `cv-app/users/${emailKey}`);
      const userSnapshot = await get(userRef);
      
      if (!userSnapshot.exists()) {
        return this.getDefaultProfile(email);
      }

      const userData = userSnapshot.val();
      
      // Obtener metadatos del usuario (incluye el email)
      const metadataRef = ref(this.database, `cv-app/users/${emailKey}/metadata`);
      const metadataSnapshot = await get(metadataRef);
      const metadata = metadataSnapshot.exists() ? metadataSnapshot.val() : {};

      // Obtener datos del perfil personal
      const profileData = userData?.profileData?.personalData || {};
      
      return {
        id: emailKey,
        email: metadata.email || email,
        fullName: profileData.fullName || 'Nombre no disponible',
        phone: profileData.phone || 'No disponible',
        profesion: profileData.profesion || 'Sin profesión especificada',
        country: metadata.country || 'País no especificado',
        direction: profileData.direction || 'Dirección no especificada',
        // Agregar más campos según sea necesario
      };
    } catch (error) {
      console.error('Error al obtener el perfil del usuario:', error);
      return this.getDefaultProfile(email);
    }
  }

  /**
   * Devuelve un perfil por defecto cuando no se encuentra la información del usuario
   * @param email Email del usuario
   */
  private getDefaultProfile(email: string): any {
    return {
      email,
      fullName: 'Usuario no encontrado',
      phone: 'No disponible',
      profesion: 'Sin profesión especificada',
      country: 'País no especificado',
      direction: 'Dirección no especificada'
    };
  }
}
