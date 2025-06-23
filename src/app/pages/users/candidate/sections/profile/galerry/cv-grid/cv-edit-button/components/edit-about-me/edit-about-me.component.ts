import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { FirebaseService } from 'src/app/shared/services/firebase.service';
import { User } from '@angular/fire/auth';
import { AboutMeInfoComponent } from './about-me-info/about-me-info.component';
import { ToastService } from 'src/app/shared/services/toast.service';
import { ConfirmationModalService } from 'src/app/shared/services/confirmation-modal.service';
import { CvEditButtonRowComponent } from '../../cv-edit-button-row/cv-edit-button-row.component';

@Component({
  selector: 'app-edit-about-me',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, AboutMeInfoComponent, CvEditButtonRowComponent],
  templateUrl: './edit-about-me.component.html',
  styleUrls: ['./edit-about-me.component.css'],
})
export class EditAboutMeComponent implements OnInit {
  @Input() currentUser: User | null = null;
  profileForm!: FormGroup;
  userEmail: string | null = null;
  editableFields: { [key: string]: boolean } = {};
  isFormDirty = false;
  originalData: { [key: string]: any } = {};

  constructor(
    private fb: FormBuilder,
    private firebaseService: FirebaseService,
    private toastService: ToastService,
    private confirmationModal: ConfirmationModalService
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    this.setEditableFields();

    if (this.currentUser && this.currentUser.email) {
      this.userEmail = this.currentUser.email.replace(/\./g, '_');
      this.loadUserData();
    } else {
      this.toastService.show('Usuario no autenticado o sin email', 'error');
    }

    this.profileForm.valueChanges.subscribe(() => {
      this.isFormDirty = this.profileForm.dirty;
    });
  }

  private initializeForm(): void {
    this.profileForm = this.fb.group({
      aboutMe: [''],
    });
  }

  private setEditableFields(): void {
    this.editableFields = {
      aboutMe: false
    };
  }

  private async loadUserData(): Promise<void> {
    if (!this.userEmail) {
      this.toastService.show('Error: Usuario no autenticado', 'error');
      return;
    }

    try {
      const userData = await this.firebaseService.getUserData(this.userEmail);
      const aboutMe = userData?.profileData?.aboutMe || '';
      this.profileForm.patchValue({ aboutMe });
      this.originalData['aboutMe'] = aboutMe;
      this.profileForm.markAsPristine();
      this.isFormDirty = false;
    } catch (error) {
      console.error('Error al cargar datos:', error);
      this.toastService.show('Error al cargar los datos del usuario', 'error');
    }
  }

  toggleEdit(field: string): void {
    const wasEditing = this.editableFields[field];
    this.editableFields[field] = !this.editableFields[field];

    if (!wasEditing) {
      this.toastService.show('Modo edición habilitado', 'info');
    } else {
      this.onSubmit().then(() => {
        this.toastService.show('Datos actualizados exitosamente', 'success');
      });
    }
  }

  onCancel(): void {
    this.editableFields['aboutMe'] = false;
    this.profileForm.get('aboutMe')?.setValue(this.originalData['aboutMe']);
    this.profileForm.markAsPristine();
    this.isFormDirty = false;
    this.toastService.show('Modo edición deshabilitado', 'error');
  }

  async onSubmit(): Promise<void> {
    if (!this.userEmail) {
      this.toastService.show('Debes iniciar sesión para guardar cambios', 'error');
      return;
    }

    if (!this.profileForm.valid) {
      this.toastService.show(
        'Por favor completa el campo "Sobre mí" correctamente (mínimo 10 caracteres)',
        'error'
      );
      return;
    }

    if (!this.isFormDirty || this.profileForm.get('aboutMe')?.value === this.originalData['aboutMe']) {
      return;
    }

    this.confirmationModal.show(
      {
        title: 'Confirmar cambios',
        message: '¿Estás seguro que deseas guardar los cambios en tu información "Sobre mí"?',
        confirmText: 'Guardar',
        cancelText: 'Cancelar'
      },
      () => this.saveChanges(),
      () => this.toastService.show('Guardado cancelado', 'info')
    );
  }

  private async saveChanges(): Promise<void> {
    try {
      const userData = await this.firebaseService.getUserData(this.userEmail!);
      const currentProfileData = userData?.profileData || {};

      const updatedProfileData = {
        ...currentProfileData,
        aboutMe: this.profileForm.value.aboutMe
      };

      await this.firebaseService.updateUserData(this.userEmail!, {
        profileData: updatedProfileData
      });

      this.originalData['aboutMe'] = this.profileForm.value.aboutMe;
      this.profileForm.markAsPristine();
      this.isFormDirty = false;
      this.editableFields['aboutMe'] = false;

      this.toastService.show('Tu información se ha guardado correctamente', 'success');
    } catch (error) {
      console.error('Error al guardar:', error);
      this.toastService.show(
        'Ocurrió un error al guardar. Por favor intenta nuevamente.',
        'error'
      );
    }
  }
}