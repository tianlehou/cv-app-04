// style.service.ts
import { Injectable, inject } from '@angular/core';
import { FirebaseService } from 'src/app/shared/services/firebase.service';
import { ComponentStyles } from './component-styles.model';

@Injectable({
  providedIn: 'root',
})
export class StyleService {
  private firebaseService = inject(FirebaseService);

  async getComponentStyles(email: string, componentName: string): Promise<ComponentStyles | null> {
    const userEmailKey = this.firebaseService.formatEmailKey(email);
    const stylesRef = this.firebaseService.getDatabaseRef(
      `cv-app/users/${userEmailKey}/cv-styles/${componentName}`
    );
    const snapshot = await this.firebaseService.getDatabaseValue(stylesRef);
    return snapshot.exists() ? (snapshot.val() as ComponentStyles) : null;
  }

  async getColorFavorites(email: string): Promise<string[]> {
    const userEmailKey = this.firebaseService.formatEmailKey(email);
    const favoritesRef = this.firebaseService.getDatabaseRef(
      `cv-app/users/${userEmailKey}/cv-styles/color-favorites`
    );
    const snapshot = await this.firebaseService.getDatabaseValue(favoritesRef);
    return snapshot.exists() ? (snapshot.val() as string[]) : [];
  }

  async saveColorFavorites(email: string, colors: string[]): Promise<void> {
    const userEmailKey = this.firebaseService.formatEmailKey(email);
    const favoritesRef = this.firebaseService.getDatabaseRef(
      `cv-app/users/${userEmailKey}/cv-styles/color-favorites`
    );
    await this.firebaseService.setDatabaseValue(favoritesRef, colors);
  }

  async updateStyles(
    email: string,
    componentName: string,
    styles: ComponentStyles
  ): Promise<void> {
    const userEmailKey = this.firebaseService.formatEmailKey(email);
    const stylesRef = this.firebaseService.getDatabaseRef(
      `cv-app/users/${userEmailKey}/cv-styles/${componentName}`
    );
    await this.firebaseService.setDatabaseValue(stylesRef, styles);
  }

  async updateUserStyles(
    email: string,
    updateData: {
      'cv-styles'?: {
        [key: string]: ComponentStyles;
      };
    }
  ): Promise<void> {
    await this.firebaseService.updateUserData(email, updateData);
  }
}