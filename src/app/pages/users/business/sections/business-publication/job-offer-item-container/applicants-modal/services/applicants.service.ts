import { Injectable, Injector, inject, runInInjectionContext } from '@angular/core';
import { Database, get, ref, set } from '@angular/fire/database';
import { Observable, from, of } from 'rxjs';
import { switchMap, catchError } from 'rxjs/operators';
import { FirebaseService } from 'src/app/shared/services/firebase.service';

@Injectable({
  providedIn: 'root'
})
export class ApplicantsService {
  private injector = inject(Injector);
  private database = inject(Database);
  private firebaseService = inject(FirebaseService);

  /**
   * Obtiene el estado actual de un postulante
   * @param companyId ID de la compañía
   * @param jobOfferId ID de la oferta
   * @param email Email del postulante
   */
  private async getApplicantStatus(companyId: string, jobOfferId: string, email: string): Promise<string> {
    return runInInjectionContext(this.injector, async () => {
      try {
        const emailKey = this.firebaseService.formatEmailKey(email);
        const statusRef = ref(
          this.database,
          `cv-app/users/${companyId}/job-offer/${jobOfferId}/applicantStatus/${emailKey}`
        );
        const statusSnapshot = await get(statusRef);
        return statusSnapshot.exists() ? statusSnapshot.val() : 'pending';
      } catch (error) {
        console.error('Error al obtener el estado del postulante:', error);
        return 'pending';
      }
    });
  }

  /**
   * Obtiene los postulantes a una oferta de trabajo
   * @param jobOfferId ID de la oferta de trabajo
   * @param companyId ID de la compañía que publicó la oferta
   */
  getApplicants(jobOfferId: string, companyId: string): Observable<any[]> {
    return new Observable(subscriber => {
      runInInjectionContext(this.injector, async () => {
        if (!jobOfferId || !companyId) {
          console.error('Se requiere el ID de la oferta y el ID de la compañía');
          subscriber.next([]);
          subscriber.complete();
          return;
        }

        try {
          // Referencia a los aplicantes de la oferta
          const applicantsRef = ref(this.database, `cv-app/users/${companyId}/job-offer/${jobOfferId}/appliedBy`);
          const snapshot = await get(applicantsRef);

          if (!snapshot.exists()) {
            subscriber.next([]);
            subscriber.complete();
            return;
          }

          const applicantsData = snapshot.val();
          const userPromises = [];

          // Obtener los datos de cada usuario que aplicó
          for (const [emailKey, applicationData] of Object.entries(applicantsData)) {
            // Verificar si el valor es true (formato anterior) o una cadena de fecha (nuevo formato)
            if (applicantsData[emailKey] === true || typeof applicantsData[emailKey] === 'string') {
              // Convertir la clave de email de nuevo al formato original
              const userEmail = emailKey.replace(/_/g, '.');
              // Buscar el perfil del usuario por email
              userPromises.push(this.getUserProfileByEmail(userEmail, applicationData, companyId, jobOfferId));
            }
          }

          // Esperar a que todas las promesas se resuelvan
          const result = await Promise.all(userPromises);
          subscriber.next(result);
          subscriber.complete();
        } catch (error) {
          console.error('Error al obtener los postulantes:', error);
          subscriber.next([]);
          subscriber.complete();
        }
      });
    });
  }

  private async getUserProfileByEmail(email: string, applicationData: any, companyId: string, jobOfferId: string): Promise<any> {
    return runInInjectionContext(this.injector, async () => {
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
        return runInInjectionContext(this.injector, async () => {
          const metadataSnapshot = await get(metadataRef);

          const metadata = metadataSnapshot.exists() ? metadataSnapshot.val() : {};

          // Obtener datos del perfil personal
          const profileData = userData?.profileData?.personalData || {};

          // Si applicationData es una cadena, es la fecha de postulación (nuevo formato)
          // Si es true, usar la fecha actual (formato antiguo)
          const applicationDate = typeof applicationData === 'string'
            ? applicationData
            : new Date().toISOString();

          return {
            id: emailKey,
            email: metadata.email || email,
            fullName: profileData.fullName || 'Nombre no disponible',
            phone: profileData.phone || 'No disponible',
            profesion: profileData.profesion || 'Sin profesión especificada',
            country: metadata.country || 'País no especificado',
            direction: profileData.direction || 'Dirección no especificada',
            applicationDate: applicationDate, // Incluir la fecha de postulación
            status: await this.getApplicantStatus(companyId, jobOfferId, email) // Obtener el estado actual
          };
        });
      } catch (error) {
        console.error('Error al obtener el perfil del usuario:', error);
        return this.getDefaultProfile(email);
      }
    });
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
      direction: 'Dirección no especificada',
      status: 'pending'
    };
  }

  /**
   * Actualiza el estado de un postulante
   * @param companyId ID de la compañía
   * @param jobOfferId ID de la oferta de trabajo
   * @param applicantEmail Email del postulante
   * @param newStatus Nuevo estado (ej: 'reviewed', 'interview', 'rejected')
   */
  updateApplicantStatus(
    companyId: string,
    jobOfferId: string,
    applicantEmail: string,
    newStatus: string
  ): Promise<void> {
    return runInInjectionContext(this.injector, async () => {
      try {
        const emailKey = this.firebaseService.formatEmailKey(applicantEmail);
        const statusRef = ref(
          this.database,
          `cv-app/users/${companyId}/job-offer/${jobOfferId}/applicantStatus/${emailKey}`
        );

        await set(statusRef, newStatus);
      } catch (error) {
        console.error('Error al actualizar el estado del postulante:', error);
        throw error; // Relanzar el error para que el componente lo maneje
      }
    });
  }
}
