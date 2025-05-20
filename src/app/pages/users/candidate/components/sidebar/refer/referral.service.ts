import {
  Injectable,
  inject,
  EnvironmentInjector,
  runInInjectionContext,
} from '@angular/core';
import {
  Database,
  ref,
  get,
  set,
  update,
  runTransaction,
  onValue,
} from '@angular/fire/database';
import { BehaviorSubject } from 'rxjs';
import { AuthService } from 'src/app/pages/home/user-type-modal/auth/auth.service';

@Injectable({
  providedIn: 'root',
})
export class ReferralService {
  private db = inject(Database);
  private authService = inject(AuthService);
  private injector = inject(EnvironmentInjector);
  private referralSource = new BehaviorSubject<string | null>(null);
  currentReferral = this.referralSource.asObservable();

  private referralStatsSource = new BehaviorSubject<{ count: number, referrals: any[] }>({ count: 0, referrals: [] });
  currentReferralStats = this.referralStatsSource.asObservable();

  // Formatear email para claves de Firebase
  private formatEmailKey(email: string): string {
    return email.replace(/\./g, '_');
  }

  // Gestión del ID de referencia
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

  // Registrar nuevo referido
  async addReferral(
    referrerId: string,
    referredFullName: string,
    referredEmail: string
  ): Promise<void> {
    return runInInjectionContext(this.injector, async () => {
      try {
        // Validaciones básicas
        if (!referrerId || !referredEmail || !referredFullName) {
          throw new Error('Datos de referencia incompletos');
        }

        const currentUser = await this.authService.getCurrentAuthUser();
        if (!currentUser?.email) throw new Error('Usuario no autenticado');

        const referredEmailKey = this.formatEmailKey(referredEmail);
        const timestamp = new Date().toISOString();

        // Obtener emailKey del referente
        const referrerEmailKey = await this.getEmailKeyByUserId(referrerId);
        if (!referrerEmailKey) throw new Error('Referente no encontrado');

        // Prevenir autoreferencias
        if (referrerEmailKey === this.formatEmailKey(currentUser.email)) {
          throw new Error('No puedes autoreferenciarte');
        }

        // Estructura de referencia
        const referralPath = `cv-app/referrals/${referrerEmailKey}/referrals/${referredEmailKey}`;
        const referralRef = ref(this.db, referralPath);

        // Verificar existencia previa
        if ((await get(referralRef)).exists()) {
          throw new Error('Usuario ya referido');
        }

        // Crear registro inicial
        await set(referralRef, {
          email: referredEmail,
          fullName: referredFullName,
          timestamp,
          subscriptionAmount: 0.00,
          subscribed: false,
          subscriptionDate: null,
          planId: null
        });

        // Actualizar contador
        await this.updateCounter(referrerEmailKey);
      } catch (error) {
        console.error('Error en addReferral:', error);
        this.handleFirebaseError(error, 'agregando referencia');
        throw error;
      }
    });
  }

  // Actualizar suscripción de referido
  async updateReferralSubscription(
    referredEmail: string,
    subscriptionAmount: number,
    planId?: string
  ): Promise<void> {
    return runInInjectionContext(this.injector, async () => {
      try {
        const referredEmailKey = this.formatEmailKey(referredEmail);

        // 1. Obtener referente del usuario
        const referredUserRef = ref(this.db, `cv-app/users/${referredEmailKey}/metadata`);
        const referredUserSnapshot = await get(referredUserRef);

        if (!referredUserSnapshot.exists()) return;

        const referredByUserId = referredUserSnapshot.val().referredBy;
        if (!referredByUserId) return;

        // 2. Convertir userId a emailKey
        const referrerEmailKey = await this.getEmailKeyByUserId(referredByUserId);
        if (!referrerEmailKey) return;

        // 3. Construir la ruta correcta para la referencia
        const referralPath = `cv-app/referrals/${referrerEmailKey}/referrals/${referredEmailKey}`;
        const referralRef = ref(this.db, referralPath);

        // 5. Actualizar los datos
        const updateData = {
          subscribed: subscriptionAmount > 0,
          subscriptionAmount: subscriptionAmount,
          subscriptionDate: subscriptionAmount > 0 ? new Date().toISOString() : null,
          planId: planId || null
        };

        await update(referralRef, updateData);
        
      } catch (error) {
        console.error('Error en updateReferralSubscription:', error);
        throw error;
      }
    });
  }

  // Obtener estadísticas de referidos
  async getReferralStats(
    userId: string
  ): Promise<{ count: number; referrals: any[] }> {
    return runInInjectionContext(this.injector, async () => {
      try {
        const emailKey = await this.getEmailKeyByUserId(userId);
        if (!emailKey) return { count: 0, referrals: [] };

        const referralRef = ref(
          this.db,
          `cv-app/referrals/${emailKey}/referrals`
        );
        const snapshot = await runInInjectionContext(this.injector, async () => {
          return await get(referralRef);
        });

        if (snapshot.exists()) {
          const referrals = snapshot.val();
          const referralList = Object.values(referrals).map((ref: any) => ({
            ...ref,
            subscriptionAmount: ref.subscriptionAmount || 0.00 // Asegurar valor por defecto
          }));

          return {
            count: referralList.length,
            referrals: referralList,
          };
        }
        return { count: 0, referrals: [] };
      } catch (error) {
        console.error('Error obteniendo estadísticas:', error);
        return { count: 0, referrals: [] };
      }
    });
  }

  // Métodos auxiliares
  private async getEmailKeyByUserId(userId: string): Promise<string | null> {
    return runInInjectionContext(this.injector, async () => {
      const indexRef = ref(
        this.db,
        `cv-app/userIndex/userId-to-emailKey/${userId}`
      );
      const snapshot = await get(indexRef);
      return snapshot.exists() ? snapshot.val() : null;
    });
  }

  private async updateCounter(referrerEmailKey: string): Promise<void> {
    return runInInjectionContext(this.injector, async () => {
      const counterRef = ref(
        this.db,
        `cv-app/referrals/${referrerEmailKey}/count`
      );
      await runTransaction(counterRef, (current) => (current || 0) + 1);
    });
  }

  setupRealtimeListener(userId: string): void {
    runInInjectionContext(this.injector, async () => {
      const emailKey = await this.getEmailKeyByUserId(userId);
      if (!emailKey) return;

      const referralRef = ref(this.db, `cv-app/referrals/${emailKey}/referrals`);

      // Usar runInInjectionContext también para onValue
      runInInjectionContext(this.injector, () => {
        onValue(referralRef, (snapshot) => {
          if (snapshot.exists()) {
            const referrals = snapshot.val();
            const referralList = Object.values(referrals).map((ref: any) => ({
              ...ref,
              subscriptionAmount: ref.subscriptionAmount || 0.00
            }));

            this.referralStatsSource.next({
              count: referralList.length,
              referrals: referralList
            });
          } else {
            this.referralStatsSource.next({ count: 0, referrals: [] });
          }
        });
      });
    });
  }

  private handleFirebaseError(error: any, context: string): void {
    const errorMessages = {
      PERMISSION_DENIED: 'Acceso no autorizado',
      'invalid-argument': 'Datos inválidos',
      'not-found': 'Recurso no encontrado',
    };

    const message =
      errorMessages[error.code as keyof typeof errorMessages] ||
      `Error al ${context}`;
    console.error(`${message}:`, error);
    throw new Error(message);
  }
}
