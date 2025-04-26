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
import { FirebaseService } from '../../../../../../../../../shared/services/firebase.service';
import { ConfirmationModalService } from '../../../../../../../../../shared/services/confirmation-modal.service';
import { User } from '@angular/fire/auth';
import { SkillsInfoComponent } from './skills-info/skills-info.component';
import { ToastService } from '../../../../../../../../../shared/services/toast.service';
import { CvEditButtonRowComponent } from '../../cv-edit-button-row/cv-edit-button-row.component';
import { DeleteButtonBComponent } from '../../../../../../../../../shared/components/buttons/delete-button/delete-button.component';

@Component({
  selector: 'app-edit-skills',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    CommonModule,
    SkillsInfoComponent,
    CvEditButtonRowComponent,
    DeleteButtonBComponent,
  ],
  templateUrl: './edit-skills.component.html',
  styleUrls: ['./edit-skills.component.css'],
})
export class EditSkillsComponent implements OnInit, OnDestroy {
  @Input() currentUser: User | null = null;
  profileForm!: FormGroup;
  userEmail: string | null = null;
  editableFields: { [key: string]: boolean } = {};
  skillIndexToDelete: number | null = null;
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
      skills: this.fb.array([]),
    });
  }

  private setEditableFields(): void {
    this.editableFields = { skills: false };
  }

  private async loadUserData(): Promise<void> {
    if (!this.userEmail) return;

    try {
      const userData = await this.firebaseService.getUserData(this.userEmail);
      this.populateSkills(userData?.profileData?.skills || []);
    } catch (error) {
      console.error('Error loading skills:', error);
    }
  }

  private populateSkills(skills: any[]): void {
    const formArray = this.skillsArray;
    formArray.clear();
    skills.forEach((skill) => {
      formArray.push(
        this.fb.group({
          name: [skill.name || '', Validators.required],
          proficiency: [skill.proficiency || ''],
          certification: [skill.certification || ''],
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

    if (this.formSubscription) {
      this.formSubscription.unsubscribe();
      this.formSubscription = null;
    }

    if (!wasEditing) {
      this.toastService.show('Modo edición habilitado', 'info');
      this.initialFormValue = JSON.parse(
        JSON.stringify(this.profileForm.getRawValue())
      );
      this.formHasChanges = false;

      this.formSubscription = this.profileForm.valueChanges.subscribe(() => {
        this.formHasChanges = !this.areObjectsEqual(
          this.initialFormValue,
          this.profileForm.getRawValue()
        );
      });
    } else {
      this.onSubmit().then(() => {
        this.toastService.show('Datos actualizados exitosamente', 'success');
      });
    }
  }

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
      const userData = await this.firebaseService.getUserData(this.userEmail);
      const currentProfileData = userData?.profileData || {};

      const updatedProfileData = {
        ...currentProfileData,
        skills: this.skillsArray.value,
      };

      await this.firebaseService.updateUserData(this.userEmail, {
        profileData: updatedProfileData,
      });

      await this.loadUserData();
    } catch (error) {
      console.error('Error al actualizar el perfil:', error);
      this.toastService.show(
        'Error al guardar datos. Intenta nuevamente.',
        'error'
      );
    }
  }

  get skillsArray(): FormArray {
    return this.profileForm.get('skills') as FormArray;
  }

  addSkill(): void {
    const skillGroup = this.fb.group({
      name: ['', Validators.required],
      proficiency: [''],
      certification: [''],
    });
    this.skillsArray.push(skillGroup);
    this.toastService.show(
      'Se ha agregado nuevo campo de habilidad',
      'success'
    );
  }

  async removeSkill(index: number): Promise<void> {
    if (index < 0 || index >= this.skillsArray.length) {
      console.error('Índice inválido al intentar eliminar una habilidad.');
      return;
    }

    this.skillsArray.removeAt(index);

    if (this.userEmail) {
      try {
        const userData = await this.firebaseService.getUserData(this.userEmail);
        const currentProfileData = userData?.profileData || {};

        const updatedProfileData = {
          ...currentProfileData,
          skills: this.skillsArray.value,
        };

        await this.firebaseService.updateUserData(this.userEmail, {
          profileData: updatedProfileData,
        });
      } catch (error) {
        console.error(
          'Error al sincronizar los datos con la base de datos:',
          error
        );
        throw error;
      }
    } else {
      console.error(
        'Usuario no autenticado. No se puede actualizar la base de datos.'
      );
      throw new Error('Usuario no autenticado');
    }
  }

  confirmDeleteSkill(index: number, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.skillIndexToDelete = index;

    this.ConfirmationModalService.show(
      {
        title: 'Eliminar habilidad',
        message: '¿Estás seguro de que deseas eliminar esta habilidad?',
        confirmText: 'Eliminar',
        cancelText: 'Cancelar',
      },
      async () => {
        if (this.skillIndexToDelete !== null) {
          try {
            await this.removeSkill(this.skillIndexToDelete);
            this.toastService.show(
              'Habilidad eliminada exitosamente.',
              'success'
            );
            this.skillIndexToDelete = null;
          } catch (error) {
            this.toastService.show('Error al eliminar la habilidad', 'error');
          }
        }
      },
      () => {
        this.skillIndexToDelete = null;
      }
    );
  }

  openInfoModal(): void {
    this.showInfoComponent = true;
  }

  toggleInfoView(): void {
    this.showInfoComponent = !this.showInfoComponent;
  }

  onCancel(): void {
    this.editableFields['skills'] = false;
    this.loadUserData();
    this.formHasChanges = false;

    if (this.formSubscription) {
      this.formSubscription.unsubscribe();
      this.formSubscription = null;
    }
    this.toastService.show('Modo edición deshabilitado', 'error');
  }
}
