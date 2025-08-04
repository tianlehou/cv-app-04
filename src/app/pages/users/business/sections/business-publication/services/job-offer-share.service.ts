import { Injectable, inject, EnvironmentInjector, runInInjectionContext } from '@angular/core';
import { Database, ref, onValue, update, increment } from '@angular/fire/database';
import { Observable, from } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class JobOfferShareService {
  private db = inject(Database);
  private injector = inject(EnvironmentInjector);

  getSharesUpdates(companyId: string, jobOfferId: string): Observable<number> {
    return new Observable<number>(subscriber => {
      runInInjectionContext(this.injector, () => {
        const sharesRef = ref(this.db, `cv-app/users/${companyId}/job-offer/${jobOfferId}/shares`);

        const unsubscribe = onValue(sharesRef, (snapshot) => {
          const shares = snapshot.val() || 0;
          subscriber.next(shares);
        }, (error) => {
          console.error('Error al obtener actualizaciones de compartidos:', error);
          subscriber.error(error);
        });

        // Retornar función de limpieza
        return () => unsubscribe();
      });
    });
  }

  shareJobOffer(companyId: string, jobOfferId: string): Observable<void> {
    return runInInjectionContext(this.injector, () => {
      const jobOfferRef = ref(this.db, `cv-app/users/${companyId}/job-offer/${jobOfferId}`);

      return from(update(jobOfferRef, {
        shares: increment(1)
      }));
    });
  }
}
