import { Component, OnInit, Input } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormArray,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { User } from '@angular/fire/auth';
import { CommonModule } from '@angular/common';
import { FirebaseService } from '../../../../../../../../../../shared/services/firebase.service';
import { ConfirmationModalService } from '../../../../../../../../../../shared/services/confirmation-modal.service';
import { ToastService } from '../../../../../../../../../../shared/services/toast.service';
import { EducationInfoComponent } from './education-info/education-info.component';

@Component({
  selector: 'app-edit-education',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, EducationInfoComponent],
  templateUrl: './edit-education.component.html',
  styleUrls: ['./edit-education.component.css'],
})
export class EditEducationComponent implements OnInit {
  @Input() currentUser: User | null = null;
  profileForm!: FormGroup;
  userEmail: string | null = null;
  editableFields: { [key: string]: boolean } = {};
  educationIndexToDelete: number | null = null;
  showInfoComponent = false;

  constructor(
    private fb: FormBuilder,
    private firebaseService: FirebaseService,
    private confirmationModalService: ConfirmationModalService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    this.setEditableFields();
    if (this.currentUser) {
      this.userEmail = this.currentUser.email?.replaceAll('.', '_') || null;
      this.loadUserData();
    }
  }

  private initializeForm(): void {
    this.profileForm = this.fb.group({
      education: this.fb.array([]),
    });
  }

  private setEditableFields(): void {
    this.editableFields = {
      education: false,
    };
  }

  private async loadUserData(): Promise<void> {
    if (!this.userEmail) {
      console.error('Error: Usuario no autenticado.');
      return;
    }

    try {
      const userData = await this.firebaseService.getUserData(this.userEmail);
      const profileData = userData?.profileData || {};
      this.populateEducation(profileData.education || []);
    } catch (error) {
      console.error('Error al cargar los datos del usuario:', error);
      this.toastService.show('Error al cargar los datos de educación', 'error');
    }
  }

  private populateEducation(educationList: any[]): void {
    const formArray = this.educationArray;
    formArray.clear();
    educationList.forEach((educationItem) => {
      const educationGroup = this.fb.group({
        year: [educationItem.year || '', Validators.required],
        institution: [educationItem.institution || '', Validators.required],
        degree: [educationItem.degree || '', Validators.required],
      });
      formArray.push(educationGroup);
    });
  }

  toggleEdit(field: string): void {
    this.editableFields[field] = !this.editableFields[field];
    if (!this.editableFields[field]) {
      this.onSubmit();
    }
  }

  async onSubmit(): Promise<void> {
    if (!this.profileForm.valid || !this.userEmail) {
      this.toastService.show(
        'Datos inválidos o usuario no autenticado',
        'error'
      );
      return;
    }

    try {
      const userData = await this.firebaseService.getUserData(this.userEmail);
      const currentProfileData = userData?.profileData || {};

      const updatedProfileData = {
        ...currentProfileData,
        education: this.educationArray.value,
      };

      await this.firebaseService.updateUserData(this.userEmail, {
        profileData: updatedProfileData,
      });

      this.toastService.show(
        'Datos de educación actualizados correctamente',
        'success'
      );
      await this.loadUserData();
    } catch (error) {
      console.error('Error al actualizar el perfil:', error);
      this.toastService.show(
        'Error al guardar los datos. Por favor, inténtalo nuevamente.',
        'error'
      );
    }
  }

  get educationArray(): FormArray {
    return this.profileForm.get('education') as FormArray;
  }

  addEducation(): void {
    const educationGroup = this.fb.group({
      year: ['', Validators.required],
      institution: ['', Validators.required],
      degree: ['', Validators.required],
    });
    this.educationArray.push(educationGroup);
  }

  async removeEducation(index: number): Promise<void> {
    if (index < 0 || index >= this.educationArray.length) {
      console.error('Índice inválido al intentar eliminar educación.');
      return;
    }

    this.educationArray.removeAt(index);

    if (this.userEmail) {
      try {
        const userData = await this.firebaseService.getUserData(this.userEmail);
        const currentProfileData = userData?.profileData || {};

        const updatedProfileData = {
          ...currentProfileData,
          education: this.educationArray.value,
        };

        await this.firebaseService.updateUserData(this.userEmail, {
          profileData: updatedProfileData,
        });

        this.toastService.show('Educación eliminada correctamente', 'success');
      } catch (error) {
        console.error(
          'Error al sincronizar los datos con la base de datos:',
          error
        );
        this.toastService.show('Error al eliminar la educación', 'error');
      }
    } else {
      console.error(
        'Usuario no autenticado. No se puede actualizar la base de datos.'
      );
    }
  }

  confirmDeleteEducation(index: number): void {
    this.educationIndexToDelete = index;
    this.confirmationModalService.show(
      {
        title: 'Eliminar Educación',
        message: '¿Estás seguro de que deseas eliminar esta educación?',
      },
      () => this.onDeleteConfirmed()
    );
  }

  onDeleteConfirmed(): void {
    if (this.educationIndexToDelete !== null) {
      this.removeEducation(this.educationIndexToDelete);
    }
    this.educationIndexToDelete = null;
  }

  // método para abrir about-me-info
  openInfoModal(): void {
    this.showInfoComponent = true;
  }

  // método para cerrar about-me-info
  toggleInfoView(): void {
    this.showInfoComponent = !this.showInfoComponent;
  }
}
