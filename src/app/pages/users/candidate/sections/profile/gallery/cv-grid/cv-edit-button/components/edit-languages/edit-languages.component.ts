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
import { FirebaseService } from 'src/app/shared/services/firebase.service';
import { ConfirmationModalService } from 'src/app/shared/services/confirmation-modal.service';
import { User } from '@angular/fire/auth';
import { LanguagesInfoComponent } from './languages-info/languages-info.component';
import { ToastService } from 'src/app/shared/components/toast/toast.service';
import { CvEditButtonRowComponent } from '../../cv-edit-button-row/cv-edit-button-row.component';
import { DeleteButtonBComponent } from 'src/app/shared/components/buttons/delete-button/delete-button.component';

@Component({
  selector: 'app-edit-languages',
  standalone: true,
  imports: [
    ReactiveFormsModule, 
    CommonModule, 
    LanguagesInfoComponent,
    CvEditButtonRowComponent,
    DeleteButtonBComponent
  ],
  templateUrl: './edit-languages.component.html',
  styleUrls: ['./edit-languages.component.css'],
})
export class EditLanguagesComponent implements OnInit, OnDestroy {
  @Input() currentUser: User | null = null;
  profileForm!: FormGroup;
  userEmail: string | null = null;
  editableFields: { [key: string]: boolean } = {};
  languageIndexToDelete: number | null = null;
  activeDeleteButton: number | null = null;
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
      languages: this.fb.array([]),
    });
  }

  private setEditableFields(): void {
    this.editableFields = { languages: false };
  }

  private async loadUserData(): Promise<void> {
    if (!this.userEmail) return;

    try {
      const userData = await this.firebaseService.getUserData(this.userEmail);
      this.populateLanguages(userData?.profileData?.languages || []);
    } catch (error) {
      console.error('Error loading languages:', error);
      this.toastService.show('Error al cargar los datos de idiomas', 'error');
    }
  }

  private populateLanguages(languageList: any[]): void {
    const formArray = this.languagesArray;
    formArray.clear();
    languageList.forEach((language) => {
      formArray.push(
        this.fb.group({
          name: [language.name || '', Validators.required],
          proficiency: [language.proficiency || ''],
          certification: [language.certification || ''],
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
        languages: this.languagesArray.value,
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

  get languagesArray(): FormArray {
    return this.profileForm.get('languages') as FormArray;
  }

  addLanguage(): void {
    const languageGroup = this.fb.group({
      name: ['', Validators.required],
      proficiency: [''],
      certification: [''],
    });
    this.languagesArray.push(languageGroup);
    this.toastService.show(
      'Se ha agregado nuevo campo de idioma',
      'success'
    );
  }

  async removeLanguage(index: number): Promise<void> {
    if (index < 0 || index >= this.languagesArray.length) {
      console.error('Índice inválido al intentar eliminar un idioma.');
      return;
    }

    this.languagesArray.removeAt(index);

    if (this.userEmail) {
      try {
        const userData = await this.firebaseService.getUserData(this.userEmail);
        const currentProfileData = userData?.profileData || {};

        const updatedProfileData = {
          ...currentProfileData,
          languages: this.languagesArray.value,
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

  confirmDeleteLanguage(index: number, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.languageIndexToDelete = index;
    this.ConfirmationModalService.show(
      {
        title: 'Eliminar Idioma',
        message: '¿Estás seguro de que deseas eliminar este idioma?',
        confirmText: 'Eliminar',
        cancelText: 'Cancelar',
      },
      async () => {
        if (this.languageIndexToDelete !== null) {
          try {
            await this.removeLanguage(this.languageIndexToDelete);
            this.toastService.show(
              'Idioma eliminado exitosamente.',
              'success'
            );
            this.languageIndexToDelete = null;
          } catch (error) {
            this.toastService.show('Error al eliminar el idioma', 'error');
          }
        }
      },
      () => {
        this.languageIndexToDelete = null;
      }
    );
  }

  onCancel(): void {
    this.editableFields['languages'] = false;
    this.loadUserData();
    this.formHasChanges = false;

    if (this.formSubscription) {
      this.formSubscription.unsubscribe();
      this.formSubscription = null;
    }
    this.toastService.show('Modo edición deshabilitado', 'error');
  }
}