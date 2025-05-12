// referral.service.ts
import { Injectable, inject } from '@angular/core';
import {
  Database,
  ref,
  get,
  set,
  runTransaction,
} from '@angular/fire/database';
import { BehaviorSubject } from 'rxjs';
import { FirebaseService } from 'src/app/shared/services/firebase.service';
import { AuthService } from 'src/app/pages/home/user-type-modal/auth/auth.service';

const increment = (
  current: number | null | undefined,
  delta: number
): number => {
  return (current || 0) + delta;
};

@Injectable({
  providedIn: 'root',
})
export class ReferralService {
  private db = inject(Database);
  private firebaseService = inject(FirebaseService);
  private authService = inject(AuthService);
  private referralSource = new BehaviorSubject<string | null>(null);
  currentReferral = this.referralSource.asObservable();

  setReferralId(referralId: string) {
    this.referralSource.next(referralId);
    localStorage.setItem('referralId', referralId);
  }

  getStoredReferralId(): string | null {
    return localStorage.getItem('referralId');
  }

  clearReferralId() {
    this.referralSource.next(null);
    localStorage.removeItem('referralId');
  }

  async addReferral(referrerId: string, referredEmail: string): Promise<void> {
    try {
      console.log(`Añadiendo referido: ${referredEmail} por ${referrerId}`);

      const referredEmailKey =
        this.firebaseService.formatEmailKey(referredEmail);
      const timestamp = new Date().toISOString();

      // 1. Obtener email key del referente usando el índice userId-to-emailKey
      const referrerEmailKey = await this.getEmailKeyByUserIdFromIndex(
        referrerId
      );
      if (!referrerEmailKey) {
        console.warn('Referrer not found in database');
        return;
      }

      console.log(`EmailKey del referente: ${referrerEmailKey}`);

      // 2. Crear o actualizar el nodo de referrals con el emailKey del referente
      // Usando transactions para mayor seguridad
      const referralRef = ref(this.db, `cv-app/referrals/${referrerEmailKey}`);

      // Primero intenta crear la estructura básica si no existe
      const snapshot = await get(referralRef);
      if (!snapshot.exists()) {
        try {
          await set(referralRef, {
            count: 0,
            referrals: {},
          });
          console.log('Creada estructura inicial de referidos');
        } catch (err) {
          console.warn('No se pudo crear estructura inicial:', err);
        }
      }

      // Ahora actualiza incrementalmente
      try {
        // Actualizar contador
        const countRef = ref(
          this.db,
          `cv-app/referrals/${referrerEmailKey}/count`
        );
        await runTransaction(countRef, (current) => {
          return (current || 0) + 1;
        });

        // Añadir nuevo referido
        const newReferralRef = ref(
          this.db,
          `cv-app/referrals/${referrerEmailKey}/referrals/${referredEmailKey}`
        );
        await set(newReferralRef, {
          email: referredEmail,
          timestamp: timestamp,
          converted: true,
        });

        console.log('Referencia actualizada correctamente');
      } catch (err) {
        console.error('Error actualizando referencia:', err);
        throw err;
      }

      // 3. Actualizar el contador de referidos en el metadata del usuario referente
      try {
        const userMetadataRef = ref(
          this.db,
          `cv-app/users/${referrerEmailKey}/metadata/referralCount`
        );

        await runTransaction(userMetadataRef, (current) => {
          return (current || 0) + 1;
        });

        console.log('Contador de usuario actualizado correctamente');
      } catch (err) {
        console.error('Error actualizando contador de usuario:', err);
      }

      console.log('Referral added successfully');
    } catch (error) {
      console.error('Error en addReferral:', error);
      throw error;
    }
  }

  // Método actualizado para usar el índice
  private async getEmailKeyByUserIdFromIndex(
    userId: string
  ): Promise<string | null> {
    if (!userId) return null;

    try {
      // 1. Primero intentar con el índice
      const indexRef = ref(
        this.db,
        `cv-app/userIndex/userId-to-emailKey/${userId}`
      );
      const snapshot = await get(indexRef);

      if (snapshot.exists()) {
        return snapshot.val();
      }

      // 2. Si no está en el índice, buscar directamente en users (con permisos adecuados)
      const currentUser = await this.authService.getCurrentAuthUser();
      if (currentUser?.email) {
        const usersRef = ref(this.db, 'cv-app/users');
        const usersSnapshot = await get(usersRef);

        if (usersSnapshot.exists()) {
          const users = usersSnapshot.val();
          for (const emailKey in users) {
            if (users[emailKey]?.metadata?.userId === userId) {
              // Actualizar el índice para futuras búsquedas
              await set(indexRef, emailKey);
              return emailKey;
            }
          }
        }
      }

      return null;
    } catch (err) {
      console.error('Error buscando emailKey:', err);
      return null;
    }
  }

  // Método legacy mantenido por compatibilidad
  private async getEmailKeyByUserIdLegacy(
    userId: string
  ): Promise<string | null> {
    if (!userId) return null;

    try {
      const usersRef = ref(this.db, 'cv-app/users');
      const snapshot = await get(usersRef);

      if (snapshot.exists()) {
        const users = snapshot.val();
        for (const emailKey in users) {
          if (users[emailKey]?.metadata?.userId === userId) {
            return emailKey;
          }
        }
      }
    } catch (err) {
      console.error('Error buscando emailKey:', err);
    }

    return null;
  }

  async getReferralStats(
    userId: string
  ): Promise<{ count: number; referrals: any[] }> {
    try {
      // Convertir userId a emailKey usando el índice
      const emailKey = await this.getEmailKeyByUserIdFromIndex(userId);
      if (!emailKey) {
        return { count: 0, referrals: [] };
      }

      // Usar emailKey para buscar las referencias
      const referralRef = ref(this.db, `cv-app/referrals/${emailKey}`);
      const snapshot = await get(referralRef);

      if (snapshot.exists()) {
        const data = snapshot.val();
        return {
          count: data.count || 0,
          referrals: data.referrals ? Object.values(data.referrals) : [],
        };
      }
    } catch (error) {
      console.error('Error obteniendo estadísticas de referidos:', error);
    }
    return { count: 0, referrals: [] };
  }
}
