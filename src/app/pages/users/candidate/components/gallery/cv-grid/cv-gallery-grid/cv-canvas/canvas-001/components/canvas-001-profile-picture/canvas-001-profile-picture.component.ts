import { Component, Input } from '@angular/core';
import { FirebaseService } from '../../../../../../../../../../../shared/services/firebase.service';
import { User } from '@angular/fire/auth';

@Component({
  selector: 'app-canvas-001-profile-picture',
  standalone: true,
  templateUrl: './canvas-001-profile-picture.component.html',
  styleUrls: ['./canvas-001-profile-picture.component.css'],
})
export class Canvas001ProfilePictureComponent {
  @Input()
  set currentUser(user: User | null) {
    if (user?.email) {
      const userEmailKey = user.email.replace(/\./g, '_');
      this.loadUserData(userEmailKey);
    } else {
      this.profilePictureUrl = null;
    }
  }
  profilePictureUrl: string | null = null;

  constructor(private firebaseService: FirebaseService) {}

  private async loadUserData(userEmailKey: string): Promise<void> {
    try {
      const userData = await this.firebaseService.getUserData(userEmailKey);
      this.profilePictureUrl = userData?.profileData?.multimedia?.picture?.profilePicture || null;
    } catch (error) {
      console.error('Error cargando datos:', error);
      alert('No se pudo cargar la imagen actual');
    }
  }
}