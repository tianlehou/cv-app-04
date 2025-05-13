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

  async addReferral(
    referrerId: string,
    referredEmail: string,
    referredFullName: string
  ): Promise<void> {
    return runInInjectionContext(this.injector, async () => {
      try {
        const referredEmailKey =
          this.firebaseService.formatEmailKey(referredEmail);
        const timestamp = new Date().toISOString();

        // 1. Get referrer's email key
        const referrerEmailKey = await runInInjectionContext(
          this.injector,
          async () => {
            return await this.getEmailKeyByUserIdFromIndex(referrerId);
          }
        );

        if (!referrerEmailKey) {
          throw new Error('Referrer not found in database');
        }

        // 2. Initialize referrals structure if not exists
        await runInInjectionContext(this.injector, async () => {
          const referralRef = ref(
            this.db,
            `cv-app/referrals/${referrerEmailKey}`
          );
          const snapshot = await get(referralRef);

          if (!snapshot.exists()) {
            await set(referralRef, { count: 0, referrals: {} });
          }
        });

        // 3. Update referral count with transaction
        await runInInjectionContext(this.injector, async () => {
          await this.safeTransaction(
            ref(this.db, `cv-app/referrals/${referrerEmailKey}/count`),
            (current) => (current || 0) + 1,
            'Updating referral count'
          );
        });

        // 4. Add new referral
        await runInInjectionContext(this.injector, async () => {
          await set(
            ref(
              this.db,
              `cv-app/referrals/${referrerEmailKey}/referrals/${referredEmailKey}`
            ),
            {
              email: referredEmail,
              fullName: referredFullName,
              timestamp,
              converted: true,
            }
          );
        });

        // 5. Update user's referral count (with admin override)
        await runInInjectionContext(this.injector, async () => {
          try {
            await this.safeTransaction(
              ref(
                this.db,
                `cv-app/users/${referrerEmailKey}/metadata/referralCount`
              ),
              (current) => (current || 0) + 1,
              'Updating user referral count'
            );
          } catch (error) {
            console.warn(
              'Standard referral count update failed, trying admin override'
            );
            await this.updateReferralCountAsAdmin(referrerEmailKey);
          }
        });
      } catch (error) {
        console.error('Error in addReferral:', error);
        this.handleFirebaseError(error, 'adding referral');
        throw error;
      }
    });
  }

  private async updateReferralCountAsAdmin(
    referrerEmailKey: string
  ): Promise<void> {
    return runInInjectionContext(this.injector, async () => {
      try {
        const adminRef = ref(
          this.db,
          `cv-app/users/${referrerEmailKey}/metadata/referralCount`
        );
        const current = (await get(adminRef)).val() || 0;
        await set(adminRef, current + 1);
      } catch (adminError) {
        console.error('Admin override also failed:', adminError);
        throw new Error('No se pudo actualizar el contador de referidos');
      }
    });
  }

  private async safeTransaction(
    dbRef: any,
    transactionUpdate: (current: any) => any,
    context: string
  ): Promise<void> {
    try {
      await runTransaction(dbRef, transactionUpdate);
    } catch (error) {
      console.error(`Transaction failed in ${context}:`, error);
      throw error;
    }
  }

  private async getEmailKeyByUserIdFromIndex(
    userId: string
  ): Promise<string | null> {
    return runInInjectionContext(this.injector, async () => {
      if (!userId) return null;

      try {
        // 1. Try index first
        const indexRef = ref(
          this.db,
          `cv-app/userIndex/userId-to-emailKey/${userId}`
        );
        const snapshot = await get(indexRef);

        if (snapshot.exists()) {
          return snapshot.val();
        }

        // 2. Fallback to direct search
        const currentUser = await this.authService.getCurrentAuthUser();
        if (currentUser?.email) {
          const usersRef = ref(this.db, 'cv-app/users');
          const usersSnapshot = await get(usersRef);

          if (usersSnapshot.exists()) {
            const users = usersSnapshot.val();
            for (const emailKey in users) {
              if (users[emailKey]?.metadata?.userId === userId) {
                await set(indexRef, emailKey);
                return emailKey;
              }
            }
          }
        }

        return null;
      } catch (err) {
        console.error('Error finding emailKey:', err);
        return null;
      }
    });
  }

  async getUserBasicInfo(
    emailKey: string
  ): Promise<{ email: string; fullName: string | null }> {
    return runInInjectionContext(this.injector, async () => {
      try {
        const referralInfoRef = ref(this.db, `cv-app/referrals/${emailKey}`);

        // Ensure each get call is explicitly within the injection context
        const referralSnapshot = await runInInjectionContext(
          this.injector,
          async () => await get(referralInfoRef)
        );

        const data = referralSnapshot.val();

        return {
          email: data?.email || '',
          fullName: data?.fullName || null,
        };
      } catch (error) {
        console.error('Error getting user basic info:', error);
        // Fallback to current user's info if getting referral info fails
        const currentUser = await this.authService.getCurrentAuthUser();
        const email = currentUser?.email || '';
        return { email, fullName: null }; // fullName might not be available here easily
      }
    });
  }

  async getReferralStats(
    userId: string
  ): Promise<{ count: number; referrals: any[] }> {
    return runInInjectionContext(this.injector, async () => {
      try {
        const emailKey = await this.getEmailKeyByUserIdFromIndex(userId);
        if (!emailKey) {
          return { count: 0, referrals: [] };
        }

        const referralRef = ref(this.db, `cv-app/referrals/${emailKey}`);
        const snapshot = await get(referralRef);

        if (snapshot.exists()) {
          const data = snapshot.val();
          return {
            count: data.count || 0,
            referrals: data.referrals ? Object.values(data.referrals) : [],
          };
        }
        return { count: 0, referrals: [] };
      } catch (error) {
        console.error('Error getting referral stats:', error);
        this.handleFirebaseError(error, 'fetching referral stats');
        return { count: 0, referrals: [] };
      }
    });
  }

  private handleFirebaseError(error: any, context: string): void {
    const errorMap: Record<string, string> = {
      permission_denied: 'No tienes permisos para realizar esta acción',
      'invalid-argument': 'Datos proporcionados no válidos',
      'not-found': 'El recurso solicitado no fue encontrado',
    };

    const friendlyMessage = errorMap[error.code] || `Error al ${context}`;
    console.error(`${friendlyMessage}:`, error);
    throw new Error(friendlyMessage);
  }
}
