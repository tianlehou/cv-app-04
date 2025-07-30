import { Injectable, inject } from '@angular/core';
import { Database, ref, onValue, update, increment } from '@angular/fire/database';
import { Observable, from } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class JobOfferBookmarkService {
  private db = inject(Database);

  getSavesUpdates(companyId: string, jobOfferId: string): Observable<number> {
    return new Observable<number>(subscriber => {
      const savesRef = ref(this.db, `cv-app/users/${companyId}/job-offer/${jobOfferId}/saves`);

      const unsubscribe = onValue(savesRef, (snapshot) => {
        const saves = snapshot.val() || 0;
        subscriber.next(saves);
      }, (error) => {
        console.error('Error al obtener actualizaciones de saves:', error);
        subscriber.error(error);
      });

      // Retornar función de limpieza
      return () => unsubscribe();
    });
  }

  saveJobOffer(companyId: string, jobOfferId: string): Observable<void> {
    const jobOfferRef = ref(this.db, `cv-app/users/${companyId}/job-offer/${jobOfferId}`);

    return from(update(jobOfferRef, {
      saves: increment(1)
    }));
  }

  unsaveJobOffer(companyId: string, jobOfferId: string): Observable<void> {
    const jobOfferRef = ref(this.db, `cv-app/users/${companyId}/job-offer/${jobOfferId}`);

    return from(update(jobOfferRef, {
      saves: increment(-1)
    }));
  }
}
