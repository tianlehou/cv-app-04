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
import { Database, ref, set, get, update, remove } from '@angular/fire/database';
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

  async saveUserData(email: string, data: { fullName: string; email: string; role: string; enabled: boolean; createdAt: string; lastLogin: string }) {
    return runInInjectionContext(this.injector, async () => {
      const userEmailKey = this.formatEmailKey(email);
      
      // Extraer metadatos
      const metadata = {
        createdAt: data.createdAt,
        lastLogin: data.lastLogin
      };
      
      // Eliminar metadatos del objeto principal
      const { createdAt, lastLogin, ...userDataWithoutMetadata } = data;
      
      // Crear referencia para datos de usuario y metadatos
      const userRef = ref(this.db, `cv-app/users/${userEmailKey}`);
      const metadataRef = ref(this.db, `cv-app/users/${userEmailKey}/metadata`);
      
      // Guardar datos de usuario (sin metadatos)
      await set(userRef, userDataWithoutMetadata);
      
      // Guardar metadatos en la ruta específica
      await set(metadataRef, metadata);
    });
  }

  isAuthenticated(): Observable<boolean> {
    return this.authState.asObservable();
  }

  async getCurrentUser() {
    return runInInjectionContext(this.injector, async () => {
      const user = this.auth.currentUser;
      if (user?.email) {
        const userEmailKey = this.formatEmailKey(user.email);
        const userRef = ref(this.db, `cv-app/users/${userEmailKey}`);
        const metadataRef = ref(this.db, `cv-app/users/${userEmailKey}/metadata`);
        
        const snapshot = await runInInjectionContext(this.injector, () =>
          get(userRef)
        );
        
        const metadataSnapshot = await runInInjectionContext(this.injector, () =>
          get(metadataRef)
        );
        
        if (snapshot.exists()) {
          const userData = snapshot.val();
          // Agregar metadatos si existen
          if (metadataSnapshot.exists()) {
            const metadata = metadataSnapshot.val();
            return { ...userData, ...metadata };
          }
          return userData;
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
      const userRef = ref(this.db, `cv-app/users/${emailKey}`);
      const metadataRef = ref(this.db, `cv-app/users/${emailKey}/metadata`);
      
      try {
        const [snapshot, metadataSnapshot] = await Promise.all([
          get(userRef),
          get(metadataRef)
        ]);
        
        if (snapshot.exists()) {
          const userData = snapshot.val();
          const metadata = metadataSnapshot.exists() ? metadataSnapshot.val() : {};
          return { ...userData, ...metadata };
        }
        return null;
      } catch (error) {
        console.error('Error al obtener datos:', error);
        throw error;
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
      email: string;
      enabled: boolean;
      fullName: string;
      role: string;
      lastLogin?: string;
      profileData: {
        direction?: string;
        editableEmail?: string;
        phone?: string;
        profesion?: string;
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
        personalData?: string;
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
        // Si hay lastLogin, actualizarlo en metadata
        if (data.lastLogin) {
          const metadataRef = ref(this.db, `cv-app/users/${userEmailKey}/metadata`);
          const metadataSnapshot = await get(metadataRef);
          
          if (metadataSnapshot.exists()) {
            // Actualizar lastLogin en metadata existente
            await update(metadataRef, { lastLogin: data.lastLogin });
          } else {
            // Crear metadata con lastLogin
            await set(metadataRef, { lastLogin: data.lastLogin });
          }
          
          // Eliminar lastLogin del objeto de actualización principal
          const { lastLogin, ...dataWithoutLastLogin } = data;
          data = dataWithoutLastLogin;
        }
        
        // Actualizar los demás datos si hay algo que actualizar
        if (Object.keys(data).length > 0) {
          const userRef = ref(this.db, `cv-app/users/${userEmailKey}`);
          await update(userRef, data);
        }
        
        console.log('Datos actualizados exitosamente');
      } catch (error) {
        console.error('Error al actualizar:', error);
        throw error;
      }
    });
  }

}