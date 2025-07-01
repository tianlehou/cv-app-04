import { Component, OnInit, Input, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import {
  FormBuilder,
  FormGroup,
  FormArray,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { User } from '@angular/fire/auth';
import { CommonModule } from '@angular/common';
import { FirebaseService } from 'src/app/shared/services/firebase.service';
import { ConfirmationModalService } from 'src/app/shared/services/confirmation-modal.service';
import { ToastService } from 'src/app/shared/services/toast.service';
import { EducationInfoComponent } from './education-info/education-info.component';
import { CvEditButtonRowComponent } from '../../cv-edit-button-row/cv-edit-button-row.component';
import { DeleteButtonBComponent } from 'src/app/shared/components/buttons/delete-button/delete-button.component';

@Component({
  selector: 'app-edit-education',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    CommonModule,
    EducationInfoComponent,
    CvEditButtonRowComponent,
    DeleteButtonBComponent,
  ],
  templateUrl: './edit-education.component.html',
  styleUrls: ['./edit-education.component.css'],
})
export class EditEducationComponent implements OnInit, OnDestroy {
  @Input() currentUser: User | null = null;
  profileForm!: FormGroup;
  userEmail: string | null = null;
  editableFields: { [key: string]: boolean } = {};
  educationIndexToDelete: number | null = null;
  activeDeleteButton: number | null = null;
  formHasChanges: boolean = false;
  private initialFormValue: any;
  private formSubscription: Subscription | null = null;

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
      education: this.fb.array([]),
    });
  }

  private setEditableFields(): void {
    this.editableFields = { education: false };
  }

  private async loadUserData(): Promise<void> {
    if (!this.userEmail) return;

    try {
      const userData = await this.firebaseService.getUserData(this.userEmail);
      this.populateEducation(userData?.profileData?.education || []);
    } catch (error) {
      console.error('Error loading education:', error);
      this.toastService.show('Error al cargar los datos de educación', 'error');
    }
  }

  private populateEducation(educationList: any[]): void {
    const formArray = this.educationArray;
    formArray.clear();
    educationList.forEach((educationItem) => {
      formArray.push(
        this.fb.group({
          degree: [educationItem.degree || '', Validators.required],
          institution: [educationItem.institution || '', Validators.required],
          place: [educationItem.place || ''],
          year: [educationItem.year || '', Validators.required],
          achievements: [educationItem.achievements || ''],
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
        education: this.educationArray.value,
      };

      await this.firebaseService.updateUserData(this.userEmail, {
        profileData: updatedProfileData,
      });

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
      degree: ['', Validators.required],
      institution: ['', Validators.required],
      place: [''],
      year: ['', Validators.required],
      achievements: [''],
    });
    this.educationArray.push(educationGroup);
    this.toastService.show(
      'Se ha agregado nuevo campo de educación',
      'success'
    );
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
        throw error;
      }
    } else {
      console.error(
        'Usuario no autenticado. No se puede actualizar la base de datos.'
      );
      throw new Error('Usuario no autenticado');
    }
  }

  confirmDeleteEducation(index: number, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.educationIndexToDelete = index;
    this.confirmationModalService.show(
      {
        title: 'Eliminar Educación',
        message: '¿Estás seguro de que deseas eliminar esta educación?',
        confirmText: 'Eliminar',
        cancelText: 'Cancelar',
      },
      async () => {
        if (this.educationIndexToDelete !== null) {
          try {
            await this.removeEducation(this.educationIndexToDelete);
            this.educationIndexToDelete = null;
          } catch (error) {
            this.toastService.show('Error al eliminar la educación', 'error');
          }
        }
      },
      () => {
        this.educationIndexToDelete = null;
      }
    );
  }

  onCancel(): void {
    this.editableFields['education'] = false;
    this.loadUserData();
    this.formHasChanges = false;

    if (this.formSubscription) {
      this.formSubscription.unsubscribe();
      this.formSubscription = null;
    }
    this.toastService.show('Modo edición deshabilitado', 'error');
  }
}
