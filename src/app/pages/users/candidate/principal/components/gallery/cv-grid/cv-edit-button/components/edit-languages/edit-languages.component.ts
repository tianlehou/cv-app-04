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
import { LanguagesInfoComponent } from './languages-info/languages-info.component';

@Component({
  selector: 'app-edit-languages',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, LanguagesInfoComponent],
  templateUrl: './edit-languages.component.html',
  styleUrls: ['./edit-languages.component.css'],
})
export class EditLanguagesComponent implements OnInit {
  @Input() currentUser: User | null = null;
  profileForm!: FormGroup;
  userEmail: string | null = null;
  editableFields: { [key: string]: boolean } = {};
  languageIndexToDelete: number | null = null;
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
      languages: this.fb.array([]),
    });
  }

  private setEditableFields(): void {
    this.editableFields = {
      languages: false,
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
      this.populateLanguages(profileData.languages || []);
    } catch (error) {
      console.error('Error al cargar los datos del usuario:', error);
    }
  }

  private populateLanguages(languageList: any[]): void {
    const formArray = this.languagesArray;
    formArray.clear();
    languageList.forEach((language) => {
      const languageGroup = this.fb.group({
        name: [language.name || '', Validators.required],
        proficiency: [language.proficiency || '', Validators.required],
        certification: [language.certification || ''],
      });
      formArray.push(languageGroup);
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
      alert('Error en los datos o usuario no autenticado.');
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

      alert('Datos actualizados exitosamente.');

      await this.loadUserData();
    } catch (error) {
      console.error('Error al actualizar el perfil:', error);
      alert('Error al guardar datos. Intenta nuevamente.');
    }
  }

  get languagesArray(): FormArray {
    return this.profileForm.get('languages') as FormArray;
  }

  addLanguage(): void {
    const languageGroup = this.fb.group({
      name: ['', Validators.required],
      proficiency: ['', Validators.required],
      certification: [''],
    });
    this.languagesArray.push(languageGroup);
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

        console.log(
          'Idioma eliminado y datos sincronizados con la base de datos.'
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

  confirmDeleteLanguage(index: number): void {
    this.languageIndexToDelete = index;
    this.ConfirmationModalService.show(
      {
        title: 'Eliminar Idioma',
        message: '¿Estás seguro de que deseas eliminar este idioma?',
      },
      () => this.onDeleteConfirmed()
    );
  }

  onDeleteConfirmed(): void {
    if (this.languageIndexToDelete !== null) {
      this.removeLanguage(this.languageIndexToDelete);
    }
    this.languageIndexToDelete = null;
  }

    // método para abrir componente-info
    openInfoModal(): void {
      this.showInfoComponent = true;
    }
  
    // método para cerrar componente-info
    toggleInfoView(): void {
      this.showInfoComponent = !this.showInfoComponent;
    }
}
