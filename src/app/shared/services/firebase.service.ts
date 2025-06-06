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

  async getUsersByCountry(countryCode: string): Promise<any[]> {
    const users = [];

    // 1. Obtener todas las keys de usuarios para ese país
    const indexRef = ref(this.db, `cv-app/countriesIndex/${countryCode}`);
    const indexSnapshot = await get(indexRef);

    if (indexSnapshot.exists()) {
      const userKeys = Object.keys(indexSnapshot.val());

      // 2. Obtener datos completos de cada usuario
      for (const userKey of userKeys) {
        const userRef = ref(this.db, `cv-app/users/${userKey}`);
        const userSnapshot = await get(userRef);
        if (userSnapshot.exists()) {
          users.push(userSnapshot.val());
        }
      }
    }

    return users;
  }

  async initializeUserData(email: string, userData: any): Promise<void> {
    const userKey = this.formatEmailKey(email);
    const userId = userData.metadata?.userId || this.generateUserId();
    const countryCode = userData.metadata?.country || 'PA'; // Default

    // Asegurar que metadata existe
    if (!userData.metadata) {
      userData.metadata = {};
    }
    userData.metadata.userId = userId;

    // 1. Crear usuario en ubicación principal
    await set(ref(this.db, `cv-app/users/${userKey}`), userData);

    // 2. Crear índice por país
    await set(
      ref(this.db, `cv-app/countriesIndex/${countryCode}/${userKey}`),
      true
    );

    // 3. Crear índice userId-to-email
    await set(
      ref(this.db, `cv-app/userIndex/userId-to-emailKey/${userId}`),
      userKey
    );
  }

  async updateUserCountry(email: string, newCountryCode: string): Promise<void> {
    const userKey = this.formatEmailKey(email);

    // 1. Obtener el país actual
    const userRef = ref(this.db, `cv-app/users/${userKey}/metadata/country`);
    const snapshot = await get(userRef);
    const currentCountry = snapshot.val();

    // 2. Actualizar el país en metadata
    await update(ref(this.db, `cv-app/users/${userKey}/metadata`), {
      country: newCountryCode
    });

    // 3. Actualizar índices de país
    if (currentCountry) {
      // Eliminar del índice anterior
      await set(
        ref(this.db, `cv-app/countriesIndex/${currentCountry}/${userKey}`),
        null
      );
    }
    // Agregar al nuevo índice
    await set(
      ref(this.db, `cv-app/countriesIndex/${newCountryCode}/${userKey}`),
      true
    );
  }

  async saveUserData(
    email: string,
    data: {
      email: string;
      role: string;
      enabled: boolean;
      createdAt: string;
      referredBy?: string; // Esto debería ser un userId, no un email
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
        ...(data.referredBy && { referredBy: data.referredBy }), // Guardamos el userId tal cual
        userId: userId,
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
        country?: string;
        createdAt?: string;
        email: string;
        enabled: boolean;
        lastLogin?: string;
        lastUpdated?: string;
        referredBy?: string;
        role?: string;
        subscriptionStatus?: string;
        userId?: string;
      }>;
      planes_adquiridos?: {
        [key: string]: {
          estado: string;
          fecha_fin: string;
          fecha_inicio: string;
          plan: string;
        };
      };
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

        // Crear objeto de actualización para metadata
        if (data.metadata) {
          const metadataUpdates: any = {};
          for (const [key, value] of Object.entries(data.metadata)) {
            if (value !== undefined) {
              metadataUpdates[`metadata/${key}`] = value;
            }
          }
          await update(ref(this.db, `cv-app/users/${userEmailKey}`), metadataUpdates);
        }

        // Crear objeto de actualización para profileData
        if (data.profileData) {
          const profileDataUpdates: any = {};
          for (const [section, sectionData] of Object.entries(data.profileData)) {
            if (sectionData !== undefined) {
              if (typeof sectionData === 'object' && !Array.isArray(sectionData)) {
                for (const [field, value] of Object.entries(sectionData)) {
                  if (value !== undefined) {
                    profileDataUpdates[`profileData/${section}/${field}`] = value;
                  }
                }
              } else {
                profileDataUpdates[`profileData/${section}`] = sectionData;
              }
            }
          }
          await update(ref(this.db, `cv-app/users/${userEmailKey}`), profileDataUpdates);
        }

        // Actualizar cv-styles si existe
        if (data['cv-styles']) {
          await update(ref(this.db, `cv-app/users/${userEmailKey}`), {
            'cv-styles': data['cv-styles']
          });
        }
      } catch (error) {
        console.error('Error al actualizar:', error);
        throw error;
      }
    });
  }
}
