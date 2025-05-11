import {
  Injectable,
  inject,
  runInInjectionContext,
  EnvironmentInjector,
} from '@angular/core';
import {
  Auth,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
} from '@angular/fire/auth';
import { Database, ref, set, get, update } from '@angular/fire/database';
import { BehaviorSubject, Observable } from 'rxjs';
import { ComponentStyles } from '../models/component-styles.model';

const increment = (delta: number) => {
  return (current: number) => (current || 0) + delta;
};

@Injectable({
  providedIn: 'root',
})
export class FirebaseService {
  private auth = inject(Auth);
  private db = inject(Database);
  private authState = new BehaviorSubject<boolean>(false);
  private injector = inject(EnvironmentInjector);
  private referralSource = new BehaviorSubject<string | null>(null);
  currentReferral = this.referralSource.asObservable();

  constructor() {
    this.monitorAuthState();
  }

  private monitorAuthState() {
    runInInjectionContext(this.injector, () => {
      onAuthStateChanged(this.auth, (user) => {
        this.authState.next(!!user);
      });
    });
  }

  isAuthenticated(): Observable<boolean> {
    return this.authState.asObservable();
  }

  public formatEmailKey(email: string): string {
    return email.replace(/\./g, '_');
  }

  registerWithEmail(email: string, password: string) {
    return runInInjectionContext(this.injector, () =>
      createUserWithEmailAndPassword(this.auth, email, password)
    );
  }

  async loginWithEmail(email: string, password: string) {
    return runInInjectionContext(this.injector, async () => {
      await signInWithEmailAndPassword(this.auth, email, password);
      return this.getCurrentUser();
    });
  }

  sendPasswordResetEmail(email: string) {
    return runInInjectionContext(this.injector, () =>
      sendPasswordResetEmail(this.auth, email)
    );
  }

  logout() {
    runInInjectionContext(this.injector, () => this.auth.signOut());
  }

  // Método corregido con runInInjectionContext
  async initializeUserData(
    email: string,
    userData: {
      profileData?: any;
      metadata?: any;
      [key: string]: any;
    }
  ): Promise<void> {
    return runInInjectionContext(this.injector, async () => {
      const userKey = this.formatEmailKey(email);
      // Inicializa toda la estructura del usuario de una vez
      return set(ref(this.db, `cv-app/users/${userKey}`), userData);
    });
  }

  async saveUserData(
    email: string,
    data: {
      email: string;
      role: string;
      enabled: boolean;
      createdAt: string;
      referredBy?: string;
    }
  ) {
    return runInInjectionContext(this.injector, async () => {
      const userEmailKey = this.formatEmailKey(email);

      // Logs de diagnóstico
      console.log('Guardando metadata para:', email);
      console.log('Usuario autenticado:', this.auth.currentUser?.email);
      console.log('Ruta metadata:', `cv-app/users/${userEmailKey}/metadata`);

      const metadataRef = ref(this.db, `cv-app/users/${userEmailKey}/metadata`);
      await set(metadataRef, {
        email: data.email,
        role: data.role,
        enabled: data.enabled,
        createdAt: data.createdAt,
        ...(data.referredBy && { referredBy: data.referredBy }),
        referralCount: 0,
      });

      if (data.referredBy) {
        await this.addReferral(data.referredBy, email);
      }
    });
  }

  async saveFullName(email: string, fullName: string) {
    return runInInjectionContext(this.injector, async () => {
      const userEmailKey = this.formatEmailKey(email);
      const personalDataRef = ref(
        this.db,
        `cv-app/users/${userEmailKey}/profileData/personalData`
      );

      let attempts = 0;
      const maxAttempts = 3;
      let lastError;

      while (attempts < maxAttempts) {
        try {
          await set(personalDataRef, {
            fullName: fullName,
          });
          return; // Éxito, salimos del método
        } catch (error) {
          lastError = error;
          attempts++;
          if (attempts < maxAttempts) {
            await new Promise((resolve) =>
              setTimeout(resolve, 1000 * attempts)
            ); // Espera exponencial
          }
        }
      }

      // Si llegamos aquí, todos los intentos fallaron
      console.error('Error después de múltiples intentos:', lastError);
      throw lastError;
    });
  }

  async getCurrentUser() {
    return runInInjectionContext(this.injector, async () => {
      const user = this.auth.currentUser;
      if (user) {
        const userEmailKey = this.formatEmailKey(user.email!);
        const userRef = ref(this.db, `cv-app/users/${userEmailKey}`);

        const userSnapshot = await get(userRef);
        if (userSnapshot.exists()) {
          const userData = userSnapshot.val();

          // Si no existe un ID, generamos uno
          if (!userData.metadata?.userId) {
            const userId = this.generateUserId();
            await update(
              ref(this.db, `cv-app/users/${userEmailKey}/metadata`),
              {
                userId: userId,
              }
            );
            return {
              ...userData,
              email: user.email,
              metadata: {
                ...userData.metadata,
                userId: userId,
              },
            };
          }

          return {
            ...userData,
            email: user.email,
          };
        }
        return null;
      }
      return null;
    });
  }

  private generateUserId(): string {
    return 'user_' + Math.random().toString(36).substr(2, 9);
  }

  async getUserData(emailKey: string): Promise<any> {
    return runInInjectionContext(this.injector, async () => {
      try {
        const userRef = ref(this.db, `cv-app/users/${emailKey}`);
        const userSnapshot = await get(userRef);

        if (!userSnapshot.exists()) {
          throw new Error('Datos de usuario no encontrados');
        }

        return userSnapshot.val();
      } catch (error) {
        console.error('Error al obtener datos:', error);
        throw new Error('No tienes permisos para acceder a estos datos');
      }
    });
  }

  async getComponentStyles(
    email: string,
    componentName: string
  ): Promise<ComponentStyles | null> {
    return runInInjectionContext(this.injector, async () => {
      const userEmailKey = this.formatEmailKey(email);
      const stylesRef = ref(
        this.db,
        `cv-app/users/${userEmailKey}/cv-styles/${componentName}`
      );
      const snapshot = await get(stylesRef);
      return snapshot.exists() ? (snapshot.val() as ComponentStyles) : null;
    });
  }

  async getColorFavorites(email: string): Promise<string[]> {
    return runInInjectionContext(this.injector, async () => {
      const userEmailKey = this.formatEmailKey(email);
      const favoritesRef = ref(
        this.db,
        `cv-app/users/${userEmailKey}/cv-styles/color-favorites`
      );
      const snapshot = await get(favoritesRef);
      return snapshot.exists() ? (snapshot.val() as string[]) : [];
    });
  }

  async saveColorFavorites(email: string, colors: string[]): Promise<void> {
    return runInInjectionContext(this.injector, async () => {
      const userEmailKey = this.formatEmailKey(email);
      const favoritesRef = ref(
        this.db,
        `cv-app/users/${userEmailKey}/cv-styles/color-favorites`
      );
      await set(favoritesRef, colors);
    });
  }

  async updateUserData(
    originalEmail: string,
    data: Partial<{
      metadata?: Partial<{
        createdAt?: string;
        email: string;
        enabled: boolean;
        lastLogin?: string;
        lastUpdated?: string;
        referredBy?: string;
        role?: string;
        userId?: string;
      }>;
      profileData?: {
        aboutMe?: string;
        education?: string;
        experience?: string;
        languages?: string;
        multimedia?: {
          picture?: {
            profilePicture?: string;
          };
          galleryImages?: string[];
          galleryVideos?: string[];
        };
        personalData?: {
          direction?: string;
          editableEmail?: string;
          fullName: string;
          phone?: string;
          profesion?: string;
        };
        skills?: string;
      };
      'cv-styles'?: {
        [key: string]: ComponentStyles;
      };
    }>
  ): Promise<void> {
    return runInInjectionContext(this.injector, async () => {
      const userEmailKey = this.formatEmailKey(originalEmail);

      try {
        // Si hay datos de metadata, actualizarlos en la ruta metadata
        if (data.metadata) {
          const metadataRef = ref(
            this.db,
            `cv-app/users/${userEmailKey}/metadata`
          );
          await update(metadataRef, data.metadata);
        }

        // Actualizar los demás datos si hay algo que actualizar
        if (data.profileData || data['cv-styles']) {
          const userRef = ref(this.db, `cv-app/users/${userEmailKey}`);
          await update(userRef, {
            ...(data.profileData && { profileData: data.profileData }),
            ...(data['cv-styles'] && { 'cv-styles': data['cv-styles'] }),
          });
        }

        console.log('Datos actualizados exitosamente');
      } catch (error) {
        console.error('Error al actualizar:', error);
        throw error;
      }
    });
  }

  // método para obtener el ID de referido
  setReferralId(referralId: string) {
    this.referralSource.next(referralId);
    // También puedes guardarlo en localStorage para persistencia
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
    return runInInjectionContext(this.injector, async () => {
      const referredEmailKey = this.formatEmailKey(referredEmail);
      const timestamp = new Date().toISOString();

      // 1. Primero obtener el conteo actual
      const referralRef = ref(this.db, `cv-app/referrals/${referrerId}`);
      const snapshot = await get(referralRef);
      const currentCount = snapshot.exists() ? snapshot.val().count || 0 : 0;

      // 2. Actualizar con el nuevo valor calculado
      await update(referralRef, {
        count: currentCount + 1,
        [`referrals/${referredEmailKey}`]: {
          email: referredEmail,
          timestamp: timestamp,
          converted: true,
        },
      });

      // 3. Actualizar contador en metadata del referente
      const referrerEmailKey = await this.getEmailKeyByUserId(referrerId);
      if (referrerEmailKey) {
        const userRef = ref(
          this.db,
          `cv-app/users/${referrerEmailKey}/metadata`
        );
        const userSnapshot = await get(
          ref(this.db, `cv-app/users/${referrerEmailKey}/metadata`)
        );
        const currentUserCount = userSnapshot.exists()
          ? userSnapshot.val().referralCount || 0
          : 0;

        await update(userRef, {
          referralCount: currentUserCount + 1,
        });
      }
    });
  }

  private async getEmailKeyByUserId(userId: string): Promise<string | null> {
    return runInInjectionContext(this.injector, async () => {
      if (!userId) return null;

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
      return null;
    });
  }

  async getReferralStats(
    userId: string
  ): Promise<{ count: number; referrals: any[] }> {
    return runInInjectionContext(this.injector, async () => {
      const referralRef = ref(this.db, `cv-app/referrals/${userId}`);
      const snapshot = await get(referralRef);

      if (snapshot.exists()) {
        const data = snapshot.val();
        return {
          count: data.count || 0,
          referrals: Object.values(data.referrals || {}),
        };
      }
      return { count: 0, referrals: [] };
    });
  }
}