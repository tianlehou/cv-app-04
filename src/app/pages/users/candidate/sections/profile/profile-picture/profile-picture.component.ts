import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { ProfileService } from '../../../services/profile.service';
import { EditPictureAndDataButtonComponent } from './edit-picture-and-data-button/edit-picture-and-data-button.component';
import { EditProfilePictureComponent } from './edit-profile-picture/edit-profile-picture.component';
import { EditPersonalDataComponent } from './edit-personal-data/edit-personal-data.component';

@Component({
  selector: 'app-profile-picture',
  standalone: true,
  imports: [EditPictureAndDataButtonComponent, EditProfilePictureComponent, EditPersonalDataComponent],
  templateUrl: './profile-picture.component.html',
  styleUrls: ['./profile-picture.component.css'],
})
export class ProfilePictureComponent implements OnInit, OnDestroy {
  @Input() currentUser: any; // Aceptamos cualquier estructura de usuario
  profilePictureUrl: string | null = null;
  private subscription!: Subscription;

  // Estado de visibilidad de los modales
  showProfilePictureModal = false;
  showPersonalDataModal = false;

  constructor(
    private profileService: ProfileService
  ) {}

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

  // Método para manejar la edición de la foto de perfil
  onEditProfilePicture(): void {
    this.showProfilePictureModal = true;
    // Desplazar al inicio de la página para asegurar que el modal sea visible
    window.scrollTo(0, 0);
  }

  // Método para manejar la edición de datos personales
  onEditPersonalData(): void {
    this.showPersonalDataModal = true;
    // Desplazar al inicio de la página para asegurar que el modal sea visible
    window.scrollTo(0, 0);
  }

  // Método para manejar el cierre del modal de foto de perfil
  onProfilePictureUpdated(updated: boolean): void {
    if (updated) {
      this.loadProfilePicture();
    }
    this.showProfilePictureModal = false;
  }

  // Método para manejar el cierre del modal de datos personales
  onPersonalDataUpdated(updated: boolean): void {
    this.showPersonalDataModal = false;
  }
}