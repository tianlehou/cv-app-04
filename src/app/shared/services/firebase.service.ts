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
import {
  Database,
  ref,
  set,
  get,
  update,
  remove,
} from '@angular/fire/database';
import { BehaviorSubject, Observable } from 'rxjs';
import { ComponentStyles } from '../models/component-styles.model';

@Injectable({
  providedIn: 'root',
})
export class FirebaseService {
  private auth = inject(Auth);
  private db = inject(Database);
  private authState = new BehaviorSubject<boolean>(false);
  private injector = inject(EnvironmentInjector);

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

  async saveUserData(
    email: string,
    data: {
      email: string;
      role: string;
      enabled: boolean;
      createdAt: string;
    }
  ) {
    return runInInjectionContext(this.injector, async () => {
      const userEmailKey = this.formatEmailKey(email);

      // Guardar TODOS los datos en metadata
      const metadataRef = ref(this.db, `cv-app/users/${userEmailKey}/metadata`);
      await set(metadataRef, {
        email: data.email,
        role: data.role,
        enabled: data.enabled,
        createdAt: data.createdAt,
      });
    });
  }

  // Nuevo método específico para guardar el nombre completo
  async saveFullName(email: string, fullName: string) {
    return runInInjectionContext(this.injector, async () => {
      const userEmailKey = this.formatEmailKey(email);
      const personalDataRef = ref(
        this.db,
        `cv-app/users/${userEmailKey}/profileData/personalData`
      );

      await set(personalDataRef, {
        fullName: fullName
      });
    });
  }

  isAuthenticated(): Observable<boolean> {
    return this.authState.asObservable();
  }

  async getCurrentUser() {
    return runInInjectionContext(this.injector, async () => {
      const user = this.auth.currentUser;
      if (user) {
        const userEmailKey = this.formatEmailKey(user.email!);
        const userRef = ref(this.db, `cv-app/users/${userEmailKey}`);
        
        const userSnapshot = await get(userRef);
        if (userSnapshot.exists()) {
          return {
            ...userSnapshot.val(),
            email: user.email // Ensure email is included
          };
        }
        return null;
      }
      return null;
    });
  }

  logout() {
    runInInjectionContext(this.injector, () => this.auth.signOut());
  }

  async getUserData(emailKey: string): Promise<any> {
    return runInInjectionContext(this.injector, async () => {
      try {
        const metadataRef = ref(this.db, `cv-app/users/${emailKey}/metadata`);
        const metadataSnapshot = await get(metadataRef);
  
        if (!metadataSnapshot.exists()) {
          throw new Error('Datos de usuario no encontrados');
        }
        
        return metadataSnapshot.val();
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
        role?: string;
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
}
