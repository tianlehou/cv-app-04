import { Injectable, inject, EnvironmentInjector, runInInjectionContext } from '@angular/core';
import { Database, ref, onValue, update, increment } from '@angular/fire/database';
import { Observable, from } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class JobOfferLikeService {
  private db = inject(Database);
  private injector = inject(EnvironmentInjector);

  getLikesUpdates(companyId: string, jobOfferId: string): Observable<number> {
    return new Observable<number>(subscriber => {
      runInInjectionContext(this.injector, () => {
        const likesRef = ref(this.db, `cv-app/users/${companyId}/job-offer/${jobOfferId}/likes`);

        const unsubscribe = onValue(likesRef, (snapshot) => {
          const likes = snapshot.val() || 0;
          subscriber.next(likes);
        }, (error) => {
          console.error('Error al obtener actualizaciones de likes:', error);
          subscriber.error(error);
        });

        // Retornar función de limpieza
        return () => unsubscribe();
      });
    });
  }

  likeJobOffer(companyId: string, jobOfferId: string): Observable<void> {
    return runInInjectionContext(this.injector, () => {
      const jobOfferRef = ref(this.db, `cv-app/users/${companyId}/job-offer/${jobOfferId}`);

      return from(update(jobOfferRef, {
        likes: increment(1)
      }));
    });
  }

  unlikeJobOffer(companyId: string, jobOfferId: string): Observable<void> {
    return runInInjectionContext(this.injector, () => {
      const jobOfferRef = ref(this.db, `cv-app/users/${companyId}/job-offer/${jobOfferId}`);

      return from(update(jobOfferRef, {
        likes: increment(-1)
      }));
    });
  }
}
