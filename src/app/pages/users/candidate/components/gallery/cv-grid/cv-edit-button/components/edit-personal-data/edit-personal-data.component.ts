// edit-personal-data.component.ts
import { Component, OnInit, Input, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { FirebaseService } from '../../../../../../../../../shared/services/firebase.service';
import { ProfileService } from '../../../../../../services/profile.service';
import { User } from '@angular/fire/auth';
import { ConfirmationModalService } from '../../../../../../../../../shared/services/confirmation-modal.service';
import { ToastService } from '../../../../../../../../../shared/services/toast.service';
import { PersonalDataInfoComponent } from './personal-data-info/personal-data-info.component';
import { CvEditButtonRowComponent } from '../../cv-edit-button-row/cv-edit-button-row.component';
import { Subscription } from 'rxjs';

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
    private firebaseService: FirebaseService,
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
    if (this.formSubscription) {
      this.formSubscription.unsubscribe();
    }
  }

  private formatEmailKey(email: string): string {
    return email.replace(/\./g, '_');
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
    if (!this.currentUser?.email) return;

    try {
      const userEmailKey = this.formatEmailKey(this.currentUser.email);
      const userData = await this.firebaseService.getUserData(userEmailKey);

      this.profileForm.patchValue({
        fullName: userData?.fullName || '',
        profesion: userData?.profileData?.personalData?.profesion || '',
        phone: userData?.profileData?.personalData?.phone || '',
        editableEmail: userData?.profileData?.personalData?.editableEmail || '',
        direction: userData?.profileData?.personalData?.direction || '',
      });

      // Save initial form value for change detection
      this.initialFormValue = JSON.parse(JSON.stringify(this.profileForm.value));
    } catch (error) {
      console.error('Error loading user data:', error);
      this.toastService.show(
        'Error al cargar los datos del usuario',
        'error',
        3000
      );
    }
  }

  toggleEdit(): void {
    if (!this.isEditing) {
      // Entering edit mode
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
      // Already in edit mode - save changes
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
    
    if (this.formSubscription) {
      this.formSubscription.unsubscribe();
      this.formSubscription = null;
    }
    
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
      const userEmailKey = this.formatEmailKey(this.currentUser.email);
      const userData = await this.firebaseService.getUserData(userEmailKey);

      const updatedData = {
        fullName: this.profileForm.value.fullName,
        profileData: {
          ...userData?.profileData,
          personalData: {
            ...userData?.profileData?.personalData,
            profesion: this.profileForm.value.profesion,
            phone: this.profileForm.value.phone,
            editableEmail: this.profileForm.value.editableEmail,
            direction: this.profileForm.value.direction,
          },
        },
      };

      await this.firebaseService.updateUserData(userEmailKey, updatedData);

      this.profileService.notifyPersonalDataUpdate({
        fullName: this.profileForm.value.fullName,
        profesion: this.profileForm.value.profesion,
        phone: this.profileForm.value.phone,
        editableEmail: this.profileForm.value.editableEmail,
        direction: this.profileForm.value.direction,
      });

      this.toastService.show('Datos actualizados exitosamente!', 'success', 3000);
      
      // Update initial form value with new data
      this.initialFormValue = JSON.parse(JSON.stringify(this.profileForm.value));
      this.isEditing = false;
      this.formHasChanges = false;
      
      if (this.formSubscription) {
        this.formSubscription.unsubscribe();
        this.formSubscription = null;
      }
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