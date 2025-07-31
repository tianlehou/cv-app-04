import { Injectable, inject, EnvironmentInjector, runInInjectionContext } from '@angular/core';
import { Database, ref, onValue, update, increment } from '@angular/fire/database';
import { Observable, from } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class JobOfferApplicationService {
  private db = inject(Database);
  private injector = inject(EnvironmentInjector);

  getApplicationsUpdates(companyId: string, jobOfferId: string): Observable<number> {
    return new Observable<number>(subscriber => {
      runInInjectionContext(this.injector, () => {
        const applicationsRef = ref(this.db, `cv-app/users/${companyId}/job-offer/${jobOfferId}/applications`);

        const unsubscribe = onValue(applicationsRef, (snapshot) => {
          const applications = snapshot.val() || 0;
          subscriber.next(applications);
        }, (error) => {
          console.error('Error al obtener actualizaciones de applications:', error);
          subscriber.error(error);
        });

        // Retornar función de limpieza
        return () => unsubscribe();
      });
    });
  }

  applicationJobOffer(companyId: string, jobOfferId: string): Observable<void> {
    return runInInjectionContext(this.injector, () => {
      const jobOfferRef = ref(this.db, `cv-app/users/${companyId}/job-offer/${jobOfferId}`);
      
      return from(update(jobOfferRef, {
        applications: increment(1)
      }));
    });
  }
}
