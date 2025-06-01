import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { ProfileService } from '../../services/profile.service';

@Component({
  selector: 'app-profile-picture',
  standalone: true,
  templateUrl: './profile-picture.component.html',
  styleUrls: ['./profile-picture.component.css'],
})
export class ProfilePictureComponent implements OnInit, OnDestroy {
  @Input() currentUser: any; // Aceptamos cualquier estructura de usuario
  profilePictureUrl: string | null = null;
  private subscription!: Subscription;

  constructor(private profileService: ProfileService) {}

  ngOnInit(): void {
    // Cargar la imagen directamente del objeto de usuario
    this.loadProfilePicture();

    // Suscribirse a actualizaciones
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

  private loadProfilePicture(): void {
    if (this.currentUser) {
      // Primero intentar con la estructura completa del dashboard
      if (this.currentUser.profileData?.multimedia?.picture?.profilePicture) {
        this.profilePictureUrl = this.currentUser.profileData.multimedia.picture.profilePicture;
      }
      // Luego intentar con la estructura de perfil normal
      else if (this.currentUser?.multimedia?.picture?.profilePicture) {
        this.profilePictureUrl = this.currentUser.multimedia.picture.profilePicture;
      }
    }
  }
}