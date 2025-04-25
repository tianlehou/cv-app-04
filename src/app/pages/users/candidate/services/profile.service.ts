// profile-picture.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

interface PersonalData {
  fullName?: string;
  profesion?: string;
  phone?: string;
  editableEmail?: string;
  direction?: string;
}

@Injectable({
  providedIn: 'root',
})
export class ProfileService {
  // Para la imagen de perfil
  private profilePictureUpdated = new BehaviorSubject<string | null>(null);
  profilePictureUpdated$ = this.profilePictureUpdated.asObservable();
  
  // Para los datos personales
  private personalDataUpdated = new BehaviorSubject<PersonalData | null>(null);
  personalDataUpdated$ = this.personalDataUpdated.asObservable();

  notifyProfilePictureUpdate(newUrl: string | null): void {
    this.profilePictureUpdated.next(newUrl);
  }

  notifyPersonalDataUpdate(updatedData: PersonalData): void {
    this.personalDataUpdated.next(updatedData);
  }
}