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
} from '@angular/fire/database';
import { BehaviorSubject } from 'rxjs';
import { FirebaseService } from 'src/app/shared/services/firebase.service';
import { AuthService } from 'src/app/pages/home/user-type-modal/auth/auth.service';

@Injectable({
  providedIn: 'root',
})
export class ReferralService {
  private db = inject(Database);
  private firebaseService = inject(FirebaseService);
  private authService = inject(AuthService);
  private injector = inject(EnvironmentInjector);
  private referralSource = new BehaviorSubject<string | null>(null);
  currentReferral = this.referralSource.asObservable();

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
          email: referredEmail, // Email del referido
          fullName: referredFullName, // Nombre completo
          timestamp, // Fecha de referencia
          subscriptionAmount: 0.00, // Estado inicial de suscripción
          subscribed: false, // Estado booleano para compatibilidad
          subscriptionDate: null // Fecha de suscripción inicial
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

  // Marcar conversión completa
  async markAsConverted(
    referrerId: string,
    referredEmail: string,
    status: boolean
  ): Promise<void> {
    return runInInjectionContext(this.injector, async () => {
      try {
        const referrerEmailKey = await this.getEmailKeyByUserId(referrerId);
        const referredEmailKey = this.formatEmailKey(referredEmail);

        const referralRef = ref(
          this.db,
          `cv-app/referrals/${referrerEmailKey}/referrals/${referredEmailKey}`
        );

        await update(referralRef, { converted: status });
      } catch (error) {
        console.error('Error actualizando conversión:', error);
        this.handleFirebaseError(error, 'actualizando conversión');
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
        const snapshot = await get(referralRef);

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
    const indexRef = ref(
      this.db,
      `cv-app/userIndex/userId-to-emailKey/${userId}`
    );

    const snapshot = await get(indexRef);
    return snapshot.exists() ? snapshot.val() : null;
  }

  private async updateCounter(referrerEmailKey: string): Promise<void> {
    const counterRef = ref(
      this.db,
      `cv-app/referrals/${referrerEmailKey}/count`
    );

    await runTransaction(counterRef, (current) => (current || 0) + 1);
  }

  async updateReferralSubscription(referralEmail: string, subscriptionAmount: number) {
    try {
      const currentUser = await this.firebaseService.getCurrentUser();
      if (!currentUser?.metadata?.userId || !currentUser.email) return;

      // Verificar que el usuario no esté intentando autoreferenciarse
      if (this.formatEmailKey(currentUser.email) === this.formatEmailKey(referralEmail)) {
        console.warn('Intento de autoreferencia bloqueado');
        return;
      }

      const referrerEmailKey = await this.getEmailKeyByUserId(currentUser.metadata.userId);
      if (!referrerEmailKey) return;

      const referralRef = ref(
        this.db,
        `cv-app/referrals/${referrerEmailKey}/referrals/${this.formatEmailKey(referralEmail)}`
      );

      // Verificar que la referencia exista antes de actualizar
      const referralSnapshot = await get(referralRef);
      if (!referralSnapshot.exists()) {
        console.warn('No se encontró referencia para actualizar');
        return;
      }

      await update(referralRef, {
        subscribed: subscriptionAmount > 0,
        subscriptionAmount: subscriptionAmount,
        subscriptionDate: subscriptionAmount > 0 ? new Date().toISOString() : null
      });
    } catch (error) {
      console.error('Error en updateReferralSubscription:', error);
      throw error;
    }
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
