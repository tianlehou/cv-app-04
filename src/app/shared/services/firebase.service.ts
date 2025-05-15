// firebase.service.ts
import {
  Injectable,
  inject,
  runInInjectionContext,
  EnvironmentInjector,
} from '@angular/core';
import { Database, ref, set, get, update } from '@angular/fire/database';
import { BehaviorSubject } from 'rxjs';
import { ComponentStyles } from '../../pages/users/candidate/components/gallery/cv-grid/cv-gallery-grid/style-control/component-styles.model';
import { AuthService } from '../../pages/home/user-type-modal/auth/auth.service';
import { FirebaseConfigService } from './firebase-config.service';

@Injectable({
  providedIn: 'root',
})
export class FirebaseService {
  private db = inject(Database);
  private injector = inject(EnvironmentInjector);
  private authService = inject(AuthService);
  private firebaseConfig = inject(FirebaseConfigService);
  private referralSource = new BehaviorSubject<string | null>(null);
  currentReferral = this.referralSource.asObservable();

  public formatEmailKey(email: string): string {
    return email.replace(/\./g, '_');
  }

  // You can now access the current environment type with:
  getCurrentEnvironment() {
    return this.firebaseConfig.getEnvironmentType();
  }

  // Métodos base para operaciones de base de datos
  getDatabaseRef(path: string) {
    return ref(this.db, path);
  }

  async getDatabaseValue(ref: any) {
    return runInInjectionContext(this.injector, async () => {
      return get(ref);
    });
  }

  async setDatabaseValue(ref: any, value: any) {
    return runInInjectionContext(this.injector, async () => {
      return set(ref, value);
    });
  }

  public generateUserId(): string {
    return 'user_' + Math.random().toString(36).substr(2, 9);
  }

  // Método corregido con runInInjectionContext
  async initializeUserData(email: string, userData: any): Promise<void> {
    const userKey = this.formatEmailKey(email);
    const userId = userData.metadata?.userId || this.generateUserId();

    // Asegurar que metadata existe
    if (!userData.metadata) {
      userData.metadata = {};
    }
    userData.metadata.userId = userId;

    // 1. Crear usuario
    await set(ref(this.db, `cv-app/users/${userKey}`), userData);

    // 2. Crear índice (con retry si falla)
    let attempts = 0;
    while (attempts < 3) {
      try {
        await set(
          ref(this.db, `cv-app/userIndex/userId-to-emailKey/${userId}`),
          userKey
        );
        break;
      } catch (err) {
        attempts++;
        if (attempts >= 3) {
          console.error('Error creando índice después de 3 intentos:', err);
        }
        await new Promise((resolve) => setTimeout(resolve, 500 * attempts));
      }
    }
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
      const userId = this.generateUserId();

      const metadataRef = ref(this.db, `cv-app/users/${userEmailKey}/metadata`);
      await set(metadataRef, {
        email: data.email,
        role: data.role,
        enabled: data.enabled,
        createdAt: data.createdAt,
        ...(data.referredBy && { referredBy: data.referredBy }),
        userId: userId,
        // Se eliminó referralCount: 0
      });

      // Crear entrada en el índice
      await set(
        ref(this.db, `cv-app/userIndex/userId-to-emailKey/${userId}`),
        userEmailKey
      );
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
      const user = this.authService.getCurrentAuthUser();
      if (user && user.email) {
        const userEmailKey = this.formatEmailKey(user.email);
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

            // Actualizar índice
            await set(
              ref(this.db, `cv-app/userIndex/userId-to-emailKey/${userId}`),
              userEmailKey
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
      }
      return null;
    });
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
        // Si hay cambio de userId, actualizar el índice
        if (data.metadata?.userId) {
          await set(
            ref(
              this.db,
              `cv-app/userIndex/userId-to-emailKey/${data.metadata.userId}`
            ),
            userEmailKey
          );
        }

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
      } catch (error) {
        console.error('Error al actualizar:', error);
        throw error;
      }
    });
  }
}
