import { Component, OnInit, Input, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
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
import { ToastService } from '../../../../../../../../../../shared/services/toast.service';
import { DeleteButtonBComponent } from '../../../../../../../../../../shared/components/buttons/delete-button/delete-button.component';
import { CvEditButtonRowComponent } from '../../cv-edit-button-row/cv-edit-button-row.component';

@Component({
  selector: 'app-edit-experience',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    CommonModule,
    ExperienceInfoComponent,
    DeleteButtonBComponent,
    CvEditButtonRowComponent,
  ],
  templateUrl: './edit-experience.component.html',
  styleUrls: ['./edit-experience.component.css'],
})
export class EditExperienceComponent implements OnInit, OnDestroy {
  @Input() currentUser: User | null = null;
  profileForm!: FormGroup;
  userEmail: string | null = null;
  editableFields: { [key: string]: boolean } = {};
  experienceIndexToDelete: number | null = null;
  activeDeleteButton: number | null = null;
  showInfoComponent = false;
  formHasChanges: boolean = false;
  private initialFormValue: any;
  private formSubscription: Subscription | null = null;

  constructor(
    private fb: FormBuilder,
    private firebaseService: FirebaseService,
    private ConfirmationModalService: ConfirmationModalService,
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

  ngOnDestroy(): void {
    // Limpiar las suscripciones al destruir el componente
    if (this.formSubscription) {
      this.formSubscription.unsubscribe();
    }
  }

  showDeleteButton(index: number): void {
    this.activeDeleteButton = index;
  }

  hideDeleteButton(index: number): void {
    if (this.activeDeleteButton === index) {
      this.activeDeleteButton = null;
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

  toggleEdit(field: string, event?: Event): void {
    if (event) {
      event.preventDefault();
    }

    const wasEditing = this.editableFields[field];
    this.editableFields[field] = !this.editableFields[field];

    // Limpiar suscripción previa si existe
    if (this.formSubscription) {
      this.formSubscription.unsubscribe();
      this.formSubscription = null;
    }

    if (!wasEditing) {
      // Mostrar toast cuando se activa el modo edición
      this.toastService.show('Modo edición habilitado', 'info');
      // Guardar el valor inicial del formulario para comparación
      this.initialFormValue = JSON.parse(
        JSON.stringify(this.profileForm.getRawValue())
      );
      this.formHasChanges = false;

      // Suscribirse a cambios en el formulario
      this.formSubscription = this.profileForm.valueChanges.subscribe(() => {
        // Verificar si el formulario ha cambiado comparando con el valor inicial
        this.formHasChanges = !this.areObjectsEqual(
          this.initialFormValue,
          this.profileForm.getRawValue()
        );
      });
    } else {
      // Mostrar toast cuando se guardan los cambios
      this.onSubmit().then(() => {
        this.toastService.show('Datos actualizados exitosamente', 'success');
      });
    }
  }

  // Método para comparar objetos y determinar si hay cambios
  private areObjectsEqual(obj1: any, obj2: any): boolean {
    return JSON.stringify(obj1) === JSON.stringify(obj2);
  }

  async onSubmit(event?: Event): Promise<void> {
    if (event) {
      event.preventDefault();
    }
    if (!this.profileForm.valid || !this.userEmail) {
      this.toastService.show('Debes completar los campos vacíos.', 'error');
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

      // this.toastService.show('Datos actualizados exitosamente.', 'success');

      // Restaurar estado
      await this.loadUserData();
    } catch (error) {
      console.error('Error al actualizar el perfil:', error);
      this.toastService.show(
        'Error al guardar datos. Intenta nuevamente.',
        'error'
      );
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
    this.toastService.show(
      'Se ha agregado nuevo campo de experiencia',
      'success'
    );
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
      } catch (error) {
        console.error(
          'Error al sincronizar los datos con la base de datos:',
          error
        );
        throw error; // Esto permitirá que confirmDeleteExperience capture el error
      }
    } else {
      console.error(
        'Usuario no autenticado. No se puede actualizar la base de datos.'
      );
      throw new Error('Usuario no autenticado');
    }
  }

  confirmDeleteExperience(index: number): void {
    this.experienceIndexToDelete = index;

    this.ConfirmationModalService.show(
      {
        title: 'Eliminar experiencia',
        message: '¿Estás seguro de que deseas eliminar esta experiencia?',
        confirmText: 'Eliminar',
        cancelText: 'Cancelar',
      },
      async () => {
        // Hacer esta función async
        if (this.experienceIndexToDelete !== null) {
          try {
            await this.removeExperience(this.experienceIndexToDelete);
            this.toastService.show(
              'Experiencia eliminada exitosamente.',
              'success'
            );
            this.experienceIndexToDelete = null;
          } catch (error) {
            this.toastService.show('Error al eliminar la experiencia', 'error');
          }
        }
      },
      () => {
        this.experienceIndexToDelete = null;
      }
    );
  }

  // método para abrir about-me-info
  openInfoModal(): void {
    this.showInfoComponent = true;
  }

  // método para cerrar about-me-info
  toggleInfoView(): void {
    this.showInfoComponent = !this.showInfoComponent;
  }

  onCancel(): void {
    this.editableFields['experience'] = false;
    this.loadUserData(); // Para resetear los cambios
    this.formHasChanges = false;

    // Limpiar la suscripción a los cambios del formulario si existe
    if (this.formSubscription) {
      this.formSubscription.unsubscribe();
      this.formSubscription = null;
    }
  }
}
