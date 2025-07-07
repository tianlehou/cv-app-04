import { FormGroup, FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import {
  Component,
  OnInit,
  Input,
  SimpleChanges,
  OnChanges,
} from '@angular/core';
import {
  Storage,
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from '@angular/fire/storage';
import { ProfileService } from 'src/app/pages/users/candidate/services/profile.service';
import { FirebaseService } from 'src/app/shared/services/firebase.service';
import { User } from '@angular/fire/auth';
import { ToastService } from 'src/app/shared/services/toast.service';
import { ConfirmationModalService } from 'src/app/shared/services/confirmation-modal.service';
import { ProfilePictureInfoComponent } from './profile-picture-info/profile-picture-info.component';
import { ImageCompressionService } from 'src/app/shared/services/image-compression.service';

@Component({
  selector: 'app-edit-profile-picture',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ProfilePictureInfoComponent],
  templateUrl: './edit-profile-picture.component.html',
  styleUrls: ['./edit-profile-picture.component.css'],
})
export class EditProfilePictureComponent implements OnInit, OnChanges {
  @Input() currentUser: User | null = null;
  profileForm!: FormGroup;
  userEmailKey: string | null = null;
  selectedFile: File | null = null;
  showInfoComponent = false;

  constructor(
    private fb: FormBuilder,
    private storage: Storage,
    private firebaseService: FirebaseService,
    private profileService: ProfileService,
    private toastService: ToastService,
    private confirmationModalService: ConfirmationModalService,
    private imageCompression: ImageCompressionService,
  ) { }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['currentUser'] && this.currentUser?.email) {
      this.userEmailKey = this.firebaseService.formatEmailKey(this.currentUser.email);
      this.loadUserData();
    }
  }

  ngOnInit(): void {
    this.initializeForm();
    if (this.currentUser?.email) {
      this.userEmailKey = this.firebaseService.formatEmailKey(this.currentUser.email);
      this.loadUserData();
    }
  }

  private initializeForm(): void {
    this.profileForm = this.fb.group({
      profilePicture: [''],
    });
  }

  private async loadUserData(): Promise<void> {
    if (!this.userEmailKey) return;

    try {
      const userData = await this.firebaseService.getUserData(this.userEmailKey!);

      if (userData?.profileData?.multimedia?.picture?.profilePicture) {
        const timestamp = new Date().getTime();
        const imageUrl = `${userData.profileData.multimedia.picture.profilePicture}?${timestamp}`;
        this.profileForm.patchValue({ profilePicture: imageUrl });
      } else {
        this.profileForm.patchValue({ profilePicture: '' });
      }
    } catch (error) {
      console.error('Error cargando datos:', error);
      this.toastService.show('No se pudo cargar la imagen actual', 'error');
    }
  }

  async onFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      try {
        // Comprimir la imagen antes de mostrarla
        this.selectedFile = await this.imageCompression.compressImage(input.files[0]);
        const reader = new FileReader();
        reader.onload = () => {
          this.profileForm.patchValue({ profilePicture: reader.result });
        };
        reader.readAsDataURL(this.selectedFile);
      } catch (error) {
        console.error('Error al comprimir imagen:', error);
        this.toastService.show('Error al procesar la imagen', 'error');
      }
    } else {
      this.profileForm.patchValue({ profilePicture: '' });
    }
  }

  async onSubmit(): Promise<void> {
    if (!this.selectedFile) {
      this.toastService.show('Selecciona una imagen válida', 'warning');
      return;
    }
    if (!this.userEmailKey || !this.currentUser?.email) {
      this.toastService.show('Debes iniciar sesión para guardar cambios', 'error');
      return;
    }

    this.confirmationModalService.show(
      {
        title: 'Confirmar Cambio',
        message: '¿Estás seguro de que deseas actualizar tu foto de perfil?',
        confirmText: 'Sí, actualizar',
        cancelText: 'Cancelar'
      },
      () => this.updateProfilePicture(),
      () => this.toastService.show('Cambio cancelado', 'info')
    );
  }

  private async updateProfilePicture(): Promise<void> {
    try {
      const PROFILE_PIC_NAME = 'profile-picture.jpg';
      const storageRef = ref(
        this.storage,
        `cv-app/users/${this.userEmailKey}/profile-pictures/${PROFILE_PIC_NAME}`
      );

      // 1. Eliminar la imagen anterior si existe
      try {
        await deleteObject(storageRef);
        console.log('Imagen anterior eliminada correctamente');
      } catch (deleteError) {
        console.log('No existía imagen previa o error al eliminar:', deleteError);
      }

      // 2. Subir la nueva imagen
      if (this.selectedFile) {
        await uploadBytes(storageRef, this.selectedFile);
      } else {
        throw new Error('No file selected for upload');
      }
      const downloadURL = await getDownloadURL(storageRef);

      // 3. Obtener datos actuales del usuario
      const userData = await this.firebaseService.getUserData(this.userEmailKey!);

      // 4. Crear objeto actualizado manteniendo todos los datos existentes
      const updatedData = {
        profileData: {
          ...(userData?.profileData || {}),
          multimedia: {
            ...(userData?.profileData?.multimedia || {}),
            picture: {
              ...(userData?.profileData?.multimedia?.picture || {}),
              profilePicture: downloadURL,
            },
          },
        },
      };

      // 5. Actualizar en Firebase
      if (this.currentUser?.email) {
        await this.firebaseService.updateUserData(this.currentUser.email, updatedData);
      } else {
        throw new Error('User email is null or undefined');
      }
      // Notifica el cambio
      this.profileService.notifyProfilePictureUpdate(downloadURL);

      this.toastService.show('¡Foto actualizada correctamente!', 'success');
      await this.loadUserData();
    } catch (error) {
      console.error('Error:', error);
      this.toastService.show(
        `Error al guardar: ${error instanceof Error ? error.message : 'Intenta nuevamente'}`,
        'error'
      );
    }
  }
}