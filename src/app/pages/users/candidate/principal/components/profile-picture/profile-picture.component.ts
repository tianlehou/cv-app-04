import { Component, Input } from '@angular/core';
import { Subscription } from 'rxjs';
import { User } from '@angular/fire/auth';
import { FirebaseService } from '../../../../../../shared/services/firebase.service';
import { ProfileService } from '../../services/profile.service';

@Component({
  selector: 'app-profile-picture',
  standalone: true,
  templateUrl: './profile-picture.component.html',
  styleUrls: ['./profile-picture.component.css'],
})
export class ProfilePictureComponent {
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
  private subscription!: Subscription;

  constructor(
    private firebaseService: FirebaseService,
    private profileService: ProfileService
  ) {}

  ngOnInit(): void {
    this.subscription = this.profileService.profilePictureUpdated$.subscribe(
      (newUrl) => {
        if (newUrl) {
          this.profilePictureUrl = newUrl;
        }
      }
    );
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

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