// firebase.service.ts
import {
  Injectable,
  inject,
  runInInjectionContext,
  EnvironmentInjector,
} from '@angular/core';
import { Database, ref, set, get, update } from '@angular/fire/database';
import { BehaviorSubject } from 'rxjs';
import { ComponentStyles } from 'src/app/pages/users/candidate/sections/profile/galerry/cv-grid/cv-gallery-grid/style-control/component-styles.model';
import { AuthService } from '../../pages/home/auth/auth.service';
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
      const userEmailKeys = Object.keys(indexSnapshot.val());

      // 2. Obtener datos completos de cada usuario
      for (const userEmailKey of userEmailKeys) {
        const userRef = ref(this.db, `cv-app/users/${userEmailKey}`);
        const userSnapshot = await get(userRef);
        if (userSnapshot.exists()) {
          users.push(userSnapshot.val());
        }
      }
    }

    return users;
  }

  async initializeUserData(email: string, userData: any): Promise<void> {
    const userEmailKey = this.formatEmailKey(email);
    const userId = userData.metadata?.userId || this.generateUserId();
    const countryCode = userData.metadata?.country || 'PA'; // Default

    // Asegurar que metadata existe
    if (!userData.metadata) {
      userData.metadata = {};
    }
    userData.metadata.userId = userId;

    // 1. Crear usuario en ubicación principal
    await set(ref(this.db, `cv-app/users/${userEmailKey}`), userData);

    // 2. Crear índice por país
    await set(
      ref(this.db, `cv-app/countriesIndex/${countryCode}/${userEmailKey}`),
      true
    );

    // 3. Crear índice userId-to-email
    await set(
      ref(this.db, `cv-app/userIndex/userId-to-emailKey/${userId}`),
      userEmailKey
    );
  }

  async updateUserCountry(email: string, newCountryCode: string): Promise<void> {
    const userEmailKey = this.formatEmailKey(email);

    // 1. Obtener el país actual
    const userRef = ref(this.db, `cv-app/users/${userEmailKey}/metadata/country`);
    const snapshot = await get(userRef);
    const currentCountry = snapshot.val();

    // 2. Actualizar el país en metadata
    await update(ref(this.db, `cv-app/users/${userEmailKey}/metadata`), {
      country: newCountryCode
    });

    // 3. Actualizar índices de país
    if (currentCountry) {
      // Eliminar del índice anterior
      await set(
        ref(this.db, `cv-app/countriesIndex/${currentCountry}/${userEmailKey}`),
        null
      );
    }
    // Agregar al nuevo índice
    await set(
      ref(this.db, `cv-app/countriesIndex/${newCountryCode}/${userEmailKey}`),
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
      referredBy?: string;
    }
  ) {
    return runInInjectionContext(this.injector, async () => {
      const userEmailKey = this.formatEmailKey(email);
      const userId = this.generateUserId();
      const userRef = ref(this.db, `cv-app/users/${userEmailKey}`);
      
      // Primero, crear la estructura básica del usuario
      const userData = {
        metadata: {
          email: data.email,
          role: data.role,
          enabled: data.enabled,
          createdAt: data.createdAt,
          userId: userId,
          lastUpdated: data.createdAt,
          ...(data.referredBy && { referredBy: data.referredBy }),
        },
        profileData: {},
        'cv-styles': {}
      };

      // Crear el usuario en la base de datos
      await set(userRef, userData);

      // Crear entrada en el índice de usuarios
      await set(
        ref(this.db, `cv-app/userIndex/userId-to-emailKey/${userId}`),
        userEmailKey
      );

      // Si hay un referido, actualizar el índice de referidos
      if (data.referredBy) {
        await set(
          ref(this.db, `cv-app/referrals/${data.referredBy}/${userEmailKey}`),
          true
        );
      }

      // Crear índice por país (usando 'PA' como valor por defecto)
      await set(
        ref(this.db, `cv-app/countriesIndex/PA/${userEmailKey}`),
        true
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
        // Usar 'example_user' directamente si es el caso, sin formatear
        const userPath = emailKey === 'example_user' ? 'example_user' : this.formatEmailKey(emailKey);
        const userRef = ref(this.db, `cv-app/users/${userPath}`);
        const userSnapshot = await get(userRef);

        if (!userSnapshot.exists()) {
          // Si no existe, devolver un objeto vacío en lugar de lanzar un error
          // para manejar mejor los casos donde el usuario no tiene datos aún
          return {};
        }

        return userSnapshot.val() || {};
      } catch (error) {
        console.error('Error al obtener datos:', error);
        // Devolver un objeto vacío en caso de error para mejor manejo
        return {};
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
        isEditor: boolean;
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
      // Usar 'example_user' si el email es 'example_user', de lo contrario formatear el email
      const userEmailKey = originalEmail === 'example_user' ? 'example_user' : this.formatEmailKey(originalEmail);
      const basePath = 'cv-app/users';

      try {
        // Si hay cambio de userId, actualizar el índice (solo para usuarios reales)
        if (data.metadata?.userId && userEmailKey !== 'example_user') {
          await set(
            ref(
              this.db,
              `${basePath}/userIndex/userId-to-emailKey/${data.metadata.userId}`
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
          if (Object.keys(metadataUpdates).length > 0) {
            await update(ref(this.db, `${basePath}/${userEmailKey}`), metadataUpdates);
          }
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
          if (Object.keys(profileDataUpdates).length > 0) {
            await update(ref(this.db, `${basePath}/${userEmailKey}`), profileDataUpdates);
          }
        }

        // Actualizar cv-styles si existe
        if (data['cv-styles']) {
          await update(ref(this.db, `${basePath}/${userEmailKey}`), {
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
