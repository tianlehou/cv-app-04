// personal-data.service.ts
import { Injectable } from '@angular/core';
import { User } from '@angular/fire/auth';
import { FirebaseService } from '../../../../shared/services/firebase.service';

@Injectable({
  providedIn: 'root'
})
export class PersonalDataService {
  constructor(private firebaseService: FirebaseService) {}

  formatEmailKey(email: string): string {
    return email.replace(/\./g, '_');
  }

  async loadUserData(user: User | null) {
    if (!user?.email) return null;

    const userEmailKey = this.formatEmailKey(user.email);
    try {
      const userData = await this.firebaseService.getUserData(userEmailKey);
      return {
        fullName: userData?.profileData?.personalData?.fullName || '',
        profesion: userData?.profileData?.personalData?.profesion || '',
        phone: userData?.profileData?.personalData?.phone || '',
        editableEmail: userData?.profileData?.personalData?.editableEmail || '',
        direction: userData?.profileData?.personalData?.direction || '',
        country: userData?.metadata?.country || '',
      };
    } catch (error) {
      console.error('Error loading personal data:', error);
      throw error;
    }
  }

  async updateUserData(emailKey: string, data: any): Promise<void> {
    return this.firebaseService.updateUserData(emailKey, data);
  }
}