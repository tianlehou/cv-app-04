import { Component, OnInit, Input } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormArray,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { FirebaseService } from '../../../../../../../../../../shared/services/firebase.service';
import { ConfirmationModalService } from '../../../../../../../../../../shared/services/confirmation-modal.service';
import { User } from '@angular/fire/auth';
import { ExperienceInfoComponent } from './experience-info/experience-info.component';

@Component({
  selector: 'app-edit-experience',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, ExperienceInfoComponent],
  templateUrl: './edit-experience.component.html',
  styleUrls: ['./edit-experience.component.css'],
})
export class EditExperienceComponent implements OnInit {
  @Input() currentUser: User | null = null;
  profileForm!: FormGroup;
  userEmail: string | null = null;
  editableFields: { [key: string]: boolean } = {};
  experienceIndexToDelete: number | null = null;
  showInfoComponent = false;

  constructor(
    private fb: FormBuilder,
    private firebaseService: FirebaseService,
    private ConfirmationModalService: ConfirmationModalService
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
      experience: this.fb.array([]),
    });
  }

  private setEditableFields(): void {
    this.editableFields = { experience: false };
  }

  private async loadUserData(): Promise<void> {
    if (!this.userEmail) return;

    try {
      const userData = await this.firebaseService.getUserData(this.userEmail);
      this.populateExperiences(userData?.profileData?.experience || []);
    } catch (error) {
      console.error('Error loading experiences:', error);
    }
  }

  private populateExperiences(experiences: any[]): void {
    const formArray = this.experienceArray;
    formArray.clear();
    experiences.forEach((exp) => {
      formArray.push(
        this.fb.group({
          year: [exp.year || '', Validators.required],
          company: [exp.company || '', Validators.required],
          role: [exp.role || '', Validators.required],
          description: [exp.description || '', Validators.required],
        })
      );
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
      alert('Deber completar los campos vacíos.');
      return;
    }

    try {
      // Obtener los datos actuales de profileData
      const userData = await this.firebaseService.getUserData(this.userEmail);
      const currentProfileData = userData?.profileData || {};

      // Actualizar únicamente el campo experience
      const updatedProfileData = {
        ...currentProfileData,
        experience: this.experienceArray.value,
      };

      // Guardar los datos actualizados en la base de datos
      await this.firebaseService.updateUserData(this.userEmail, {
        profileData: updatedProfileData,
      });

      alert('Datos actualizados exitosamente.');

      // Restaurar estado
      await this.loadUserData();
    } catch (error) {
      console.error('Error al actualizar el perfil:', error);
      alert('Error al guardar datos. Intenta nuevamente.');
    }
  }

  get experienceArray(): FormArray {
    return this.profileForm.get('experience') as FormArray;
  }

  addExperience(): void {
    const experienceGroup = this.fb.group({
      year: ['', Validators.required],
      company: ['', Validators.required],
      role: ['', Validators.required],
      description: ['', Validators.required],
    });
    this.experienceArray.push(experienceGroup);
  }

  async removeExperience(index: number): Promise<void> {
    if (index < 0 || index >= this.experienceArray.length) {
      console.error('Índice inválido al intentar eliminar una experiencia.');
      return;
    }

    this.experienceArray.removeAt(index);

    if (this.userEmail) {
      try {
        const userData = await this.firebaseService.getUserData(this.userEmail);
        const currentProfileData = userData?.profileData || {};

        const updatedProfileData = {
          ...currentProfileData,
          experience: this.experienceArray.value,
        };

        await this.firebaseService.updateUserData(this.userEmail, {
          profileData: updatedProfileData,
        });
        console.log(
          'Experiencia eliminada y datos sincronizados con la base de datos.'
        );
      } catch (error) {
        console.error(
          'Error al sincronizar los datos con la base de datos:',
          error
        );
      }
    } else {
      console.error(
        'Usuario no autenticado. No se puede actualizar la base de datos.'
      );
    }
  }

  confirmDeleteExperience(index: number): void {
    this.experienceIndexToDelete = index;
    this.ConfirmationModalService.show(
      {
        title: 'Eliminar experiencia',
        message: '¿Estás seguro de que deseas eliminar esta experiencia?',
      },
      () => this.onDeleteConfirmed()
    );
  }

  onDeleteConfirmed(): void {
    if (this.experienceIndexToDelete !== null) {
      this.removeExperience(this.experienceIndexToDelete);
    }
    this.experienceIndexToDelete = null;
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
