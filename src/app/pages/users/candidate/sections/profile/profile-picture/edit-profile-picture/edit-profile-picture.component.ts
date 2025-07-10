import { FormGroup, FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Component, OnInit, Input, SimpleChanges, OnChanges } from '@angular/core';
import { inject, runInInjectionContext, EnvironmentInjector } from '@angular/core';
import {
  Storage,
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from '@angular/fire/storage';
import { ProfileService } from 'src/app/pages/users/candidate/services/profile.service';
import { FirebaseService } from 'src/app/shared/services/firebase.service';
import { ExamplesService } from 'src/app/shared/services/examples.service';
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
  @Input() isEditor = false;
  @Input() isExample = false;
  @Input() exampleId: string | null = null;

  profileForm!: FormGroup;
  userEmailKey: string | null = null;
  selectedFile: File | null = null;
  showInfoComponent = false;

  injector = inject(EnvironmentInjector);

  constructor(
    private fb: FormBuilder,
    private storage: Storage,
    private firebaseService: FirebaseService,
    private examplesService: ExamplesService,
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
      console.warn('No se seleccionó ningún archivo');
      this.toastService.show('Selecciona una imagen válida', 'warning');
      return;
    }

    // Validación para modo ejemplo
    if (this.isExample) {
      if (!this.exampleId) {
        console.error('Modo ejemplo activado pero no se proporcionó exampleId');
        this.toastService.show('Error de configuración del ejemplo', 'error');
        return;
      }
    }
    // Validación para modo normal (usuario autenticado)
    else if (!this.userEmailKey || !this.currentUser?.email) {
      console.warn('Intento de subida sin autenticación en modo normal');
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
      let storagePath: string;

      if (this.isExample && this.exampleId) {
        storagePath = `cv-app/examples/${this.exampleId}/profile-picture/${PROFILE_PIC_NAME}`;
      } else {
        storagePath = `cv-app/users/${this.userEmailKey}/profile-pictures/${PROFILE_PIC_NAME}`;
      }

      let storageRef: any;
      await runInInjectionContext(this.injector, async () => {
        storageRef = ref(this.storage, storagePath);
      });

      // 1. Eliminar la imagen anterior si existe
      await runInInjectionContext(this.injector, async () => {
        await deleteObject(storageRef);
      });

      // 2. Subir la nueva imagen;
      if (this.selectedFile) {
        // Subir la imagen
        const uploadTask = await runInInjectionContext(this.injector, async () => {
          return await uploadBytes(storageRef, this.selectedFile!);
        });

        // Obtener la URL de descarga
        const downloadURL = await runInInjectionContext(this.injector, async () => {
          return await getDownloadURL(uploadTask.ref);
        });

        // Actualizar la base de datos según el modo
        if (this.isExample && this.exampleId) {
          // Modo ejemplo: Actualizar en la colección de ejemplos
          const exampleData = {
            profilePicture: downloadURL,
          };

          await this.examplesService.updateExampleData(this.exampleId, exampleData);
        } else if (this.userEmailKey) {
          // Modo usuario normal: Actualizar datos del usuario
          const userData = await this.firebaseService.getUserData(this.userEmailKey);

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

          await this.firebaseService.updateUserData(this.userEmailKey, updatedData);

          // Notifica el cambio
          this.profileService.notifyProfilePictureUpdate(downloadURL);
        }

        // Actualizar la vista previa
        this.profileForm.patchValue({ profilePicture: downloadURL });
        this.toastService.show('¡Foto actualizada correctamente!', 'success');
      }
    } catch (error) {
      console.error('Error al actualizar la foto de perfil:', error);
      this.toastService.show(
        `Error al guardar: ${error instanceof Error ? error.message : 'Intenta nuevamente'}`,
        'error'
      );
    }
  }
}