import { Injectable } from '@angular/core';
import { Observable, from } from 'rxjs';
import { Database, ref, onValue, update, increment } from '@angular/fire/database';
import { inject } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class JobOfferLikeService {
  private db = inject(Database);

  getLikesUpdates(companyId: string, jobOfferId: string): Observable<number> {
    return new Observable<number>(subscriber => {
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
  }

  likeJobOffer(companyId: string, jobOfferId: string): Observable<void> {
    const jobOfferRef = ref(this.db, `cv-app/users/${companyId}/job-offer/${jobOfferId}`);
    
    return from(update(jobOfferRef, {
      likes: increment(1)
    }));
  }

  unlikeJobOffer(companyId: string, jobOfferId: string): Observable<void> {
    const jobOfferRef = ref(this.db, `cv-app/users/${companyId}/job-offer/${jobOfferId}`);
    
    return from(update(jobOfferRef, {
      likes: increment(-1)
    }));
  }
}
