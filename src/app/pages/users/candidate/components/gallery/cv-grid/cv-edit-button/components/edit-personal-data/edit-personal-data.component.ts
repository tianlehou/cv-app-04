import { Component, OnInit, Input, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { User } from '@angular/fire/auth';
import { Subscription } from 'rxjs';
import { ConfirmationModalService } from '../../../../../../../../../shared/services/confirmation-modal.service';
import { ToastService } from '../../../../../../../../../shared/services/toast.service';
import { PersonalDataInfoComponent } from './personal-data-info/personal-data-info.component';
import { CvEditButtonRowComponent } from '../../cv-edit-button-row/cv-edit-button-row.component';
import { PersonalDataService } from '../../../../../../services/personal-data.service';
import { ProfileService } from '../../../../../../services/profile.service';

@Component({
  selector: 'app-edit-personal-data',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    CommonModule,
    PersonalDataInfoComponent,
    CvEditButtonRowComponent,
  ],
  templateUrl: './edit-personal-data.component.html',
  styleUrls: ['./edit-personal-data.component.css'],
})
export class EditPersonalDataComponent implements OnInit, OnDestroy {
  @Input() currentUser: User | null = null;
  profileForm!: FormGroup;
  isEditing: boolean = false;
  formHasChanges: boolean = false;
  private initialFormValue: any;
  private formSubscription: Subscription | null = null;

  constructor(
    private fb: FormBuilder,
    private personalDataService: PersonalDataService,
    private profileService: ProfileService,
    private confirmationModal: ConfirmationModalService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    if (this.currentUser) {
      this.loadUserData();
    }
  }

  ngOnDestroy(): void {
    this.formSubscription?.unsubscribe();
  }

  private initializeForm(): void {
    this.profileForm = this.fb.group({
      fullName: ['', [Validators.required, Validators.minLength(3)]],
      profesion: ['', [Validators.required]],
      phone: ['', [Validators.pattern(/^\d{4}-\d{4}$/), Validators.minLength(8)]],
      editableEmail: ['', [Validators.required, Validators.email]],
      direction: ['', [Validators.required, Validators.minLength(3)]],
    });
  }

  formatPhoneNumber(event: Event): void {
    const input = event.target as HTMLInputElement;
    let value = input.value.replace(/-/g, '');
    if (value.length > 4) {
      value = value.slice(0, 4) + '-' + value.slice(4, 8);
    }
    input.value = value;
    this.profileForm.get('phone')?.setValue(value);
  }

  private async loadUserData(): Promise<void> {
    try {
      const personalData = await this.personalDataService.loadUserData(this.currentUser);
      this.profileForm.patchValue(personalData || {});
      this.initialFormValue = JSON.parse(JSON.stringify(this.profileForm.value));
    } catch (error) {
      console.error('Error loading user data:', error);
      this.toastService.show('Error al cargar los datos del usuario', 'error', 3000);
    }
  }

  toggleEdit(): void {
    if (!this.isEditing) {
      this.isEditing = true;
      this.initialFormValue = JSON.parse(JSON.stringify(this.profileForm.value));
      this.formHasChanges = false;
      
      this.formSubscription = this.profileForm.valueChanges.subscribe(() => {
        this.formHasChanges = !this.areObjectsEqual(
          this.initialFormValue,
          this.profileForm.value
        );
      });
      
      this.toastService.show('Modo edición habilitado', 'info');
    } else {
      if (this.formHasChanges) {
        this.confirmationModal.show(
          {
            title: 'Confirmar cambios',
            message: '¿Estás seguro que deseas guardar los cambios en tus datos personales?',
            confirmText: 'Guardar',
            cancelText: 'Cancelar'
          },
          () => this.onSubmit(),
          () => this.onCancel()
        );
      } else {
        this.onCancel();
      }
    }
  }

  private areObjectsEqual(obj1: any, obj2: any): boolean {
    return JSON.stringify(obj1) === JSON.stringify(obj2);
  }

  onCancel(): void {
    this.isEditing = false;
    this.profileForm.patchValue(this.initialFormValue);
    this.formHasChanges = false;
    this.formSubscription?.unsubscribe();
    this.formSubscription = null;
    this.toastService.show('Modo edición deshabilitado', 'error');
  }

  async onSubmit(): Promise<void> {
    if (!this.currentUser?.email) {
      this.toastService.show('Usuario no autenticado.', 'error', 3000);
      return;
    }

    if (!this.profileForm.valid) {
      this.toastService.show('Por favor complete todos los campos requeridos correctamente.', 'error', 3000);
      return;
    }

    try {
      const userEmailKey = this.personalDataService.formatEmailKey(this.currentUser.email);
      const updatedData = {
        profileData: {
          personalData: this.profileForm.value
        }
      };

      await this.personalDataService.updateUserData(userEmailKey, updatedData);

      this.profileService.notifyPersonalDataUpdate(this.profileForm.value);
      this.toastService.show('Datos actualizados exitosamente!', 'success', 3000);
      
      this.initialFormValue = JSON.parse(JSON.stringify(this.profileForm.value));
      this.isEditing = false;
      this.formHasChanges = false;
      this.formSubscription?.unsubscribe();
      this.formSubscription = null;
    } catch (error) {
      console.error('Error:', error);
      this.toastService.show(
        'Error al guardar los datos. Por favor intente nuevamente.',
        'error',
        3000
      );
    }
  }
}