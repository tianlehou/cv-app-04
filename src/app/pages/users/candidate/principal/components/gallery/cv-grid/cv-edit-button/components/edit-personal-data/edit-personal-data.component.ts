import { Component, OnInit, Input } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { FirebaseService } from '../../../../../../../../../../shared/services/firebase.service';
import { ProfileService } from '../../../../../../services/profile.service';
import { User } from '@angular/fire/auth';
import { ConfirmationModalService } from '../../../../../../../../../../shared/services/confirmation-modal.service';
import { ToastService } from '../../../../../../../../../../shared/services/toast.service';
import { PersonalDataInfoComponent } from './personal-data-info/personal-data-info.component';

@Component({
  selector: 'app-edit-personal-data',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, PersonalDataInfoComponent],
  templateUrl: './edit-personal-data.component.html',
  styleUrls: ['./edit-personal-data.component.css'],
})
export class EditPersonalDataComponent implements OnInit {
  @Input() currentUser: User | null = null;
  profileForm!: FormGroup;
  editableFields: { [key: string]: boolean } = {};
  originalValues: { [key: string]: any } = {}; // Almacena los valores originales de cada campo
  showInfoComponent = false;

  // Diccionario para nombres descriptivos de campos
  private fieldNames: { [key: string]: string } = {
    fullName: 'Nombre Completo',
    profesion: 'Profesión',
    phone: 'Teléfono',
    editableEmail: 'Correo Electrónico',
    direction: 'Dirección',
  };

  constructor(
    private fb: FormBuilder,
    private firebaseService: FirebaseService,
    private profileService: ProfileService,
    private confirmationModal: ConfirmationModalService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    this.setEditableFields();
    if (this.currentUser) {
      this.loadUserData();
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

    // Guardar valores iniciales
    Object.keys(this.profileForm.controls).forEach(field => {
      this.originalValues[field] = this.profileForm.get(field)?.value;
    });
  }

  formatPhoneNumber(event: Event): void {
    const input = event.target as HTMLInputElement;
    let value = input.value.replace(/-/g, '');
    if (value.length > 4) {
      value = value.slice(0, 4) + '-' + value.slice(4, 8);
    }
    input.value = value;
  }

  private setEditableFields(): void {
    this.editableFields = {
      fullName: false,
      profesion: false,
      phone: false,
      editableEmail: false,
      direction: false,
    };
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

      // Actualizar valores originales después de cargar los datos
      Object.keys(this.profileForm.controls).forEach(field => {
        this.originalValues[field] = this.profileForm.get(field)?.value;
      });
    } catch (error) {
      console.error('Error loading user data:', error);
      this.toastService.show(
        'Error al cargar los datos del usuario',
        'error',
        3000
      );
    }
  }

  // Verifica si hay cambios en un campo específico
  hasChanges(field: string): boolean {
    const control = this.profileForm.get(field);
    return control ? control.value !== this.originalValues[field] : false;
  }

  // Determina el texto del botón según el estado
  getButtonText(field: string): string {
    if (!this.editableFields[field]) {
      return 'Editar';
    }
    return this.hasChanges(field) ? 'Guardar' : 'Cancelar';
  }

  // Determina la clase del botón según el estado
  getButtonClass(field: string): string {
    if (!this.editableFields[field]) {
      return '';
    }
    return this.hasChanges(field) ? 'editing' : 'cancel';
  }

  toggleEdit(field: string): void {
    // Caso 1: Si está en modo edición y no hay cambios (Cancelar)
    if (this.editableFields[field] && !this.hasChanges(field)) {
      this.editableFields[field] = false;
      return;
    }

    // Caso 2: Si está en modo edición y hay cambios (Guardar)
    if (this.editableFields[field] && this.hasChanges(field)) {
      const control = this.profileForm.get(field);
      if (control?.invalid) {
        this.toastService.show(
          `Por favor complete el campo "${this.fieldNames[field]}" correctamente.`,
          'error',
          3000
        );
        return;
      }

      this.confirmationModal.show(
        {
          title: 'Confirmar cambios',
          message: `¿Está seguro que desea guardar los cambios en "${this.fieldNames[field]}"?`,
          confirmText: 'Guardar',
          cancelText: 'Cancelar',
        },
        () => {
          this.onSubmit(field);
          this.originalValues[field] = this.profileForm.get(field)?.value; // Actualizar valor original
          this.editableFields[field] = false;
        },
        () => {
          // Si cancela, revertir los cambios
          this.profileForm.get(field)?.setValue(this.originalValues[field]);
          this.editableFields[field] = false;
        }
      );
      return;
    }

    // Caso 3: Si hay otro campo en edición pero sin cambios
    const currentlyEditingField = Object.keys(this.editableFields).find(
      (key) => this.editableFields[key]
    );

    if (currentlyEditingField) {
      // Si el campo actualmente en edición no tiene cambios, simplemente lo cerramos
      if (!this.hasChanges(currentlyEditingField)) {
        this.editableFields[currentlyEditingField] = false;
        this.editableFields[field] = true;
        return;
      }

      // Si el campo actualmente en edición tiene cambios, mostramos confirmación
      const control = this.profileForm.get(currentlyEditingField);
      if (control?.invalid) {
        this.toastService.show(
          `Por favor complete el campo "${this.fieldNames[currentlyEditingField]}" correctamente antes de editar otro campo.`,
          'error',
          3000
        );
        return;
      }

      this.confirmationModal.show(
        {
          title: 'Confirmar cambios',
          message: `¿Desea guardar los cambios en "${this.fieldNames[currentlyEditingField]}" antes de editar otro campo?`,
          confirmText: 'Guardar y continuar',
          cancelText: 'Cancelar',
        },
        () => {
          this.onSubmit(currentlyEditingField).then(() => {
            // Desactivar el campo anterior y activar el nuevo
            this.editableFields[currentlyEditingField] = false;
            this.editableFields[field] = true;
            // Actualizar valor original del campo anterior
            this.originalValues[currentlyEditingField] = this.profileForm.get(
              currentlyEditingField
            )?.value;
          });
        },
        () => {
          this.toastService.show('Cambios no guardados', 'info', 2000);
        }
      );
      return;
    }

    // Caso 4: No hay campos en edición - activar el modo edición
    this.editableFields[field] = true;
  }

  async onSubmit(field?: string): Promise<void> {
    if (!this.currentUser?.email) {
      this.toastService.show('Usuario no autenticado.', 'error', 3000);
      return;
    }

    try {
      const userEmailKey = this.formatEmailKey(this.currentUser.email);
      const userData = await this.firebaseService.getUserData(userEmailKey);

      const updatedData: any = {
        fullName: userData?.fullName || '',
        profileData: {
          ...userData?.profileData,
          personalData: {
            ...userData?.profileData?.personalData,
          },
        },
      };

      if (field) {
        if (field === 'fullName') {
          updatedData.fullName = this.profileForm.value.fullName;
        } else {
          updatedData.profileData.personalData[field] =
            this.profileForm.value[field];
        }
      } else {
        updatedData.fullName = this.profileForm.value.fullName;
        updatedData.profileData.personalData = {
          ...updatedData.profileData.personalData,
          ...this.profileForm.value,
        };
      }

      await this.firebaseService.updateUserData(
        this.currentUser.email,
        updatedData
      );

      const dataToNotify = {
        fullName: updatedData.fullName,
        ...(field === 'fullName'
          ? {}
          : {
              profesion: updatedData.profileData.personalData.profesion,
              phone: updatedData.profileData.personalData.phone,
              editableEmail: updatedData.profileData.personalData.editableEmail,
              direction: updatedData.profileData.personalData.direction,
            }),
        ...(field && field !== 'fullName'
          ? { [field]: this.profileForm.value[field] }
          : {}),
      };

      this.profileService.notifyPersonalDataUpdate(dataToNotify);

      this.toastService.show(
        field
          ? `"${this.fieldNames[field]}" actualizado exitosamente!`
          : 'Datos actualizados exitosamente!',
        'success',
        3000
      );

      // Actualizar valores originales después de guardar
      if (field) {
        this.originalValues[field] = this.profileForm.get(field)?.value;
      } else {
        Object.keys(this.profileForm.controls).forEach(field => {
          this.originalValues[field] = this.profileForm.get(field)?.value;
        });
      }

      await this.loadUserData();
    } catch (error) {
      console.error('Error:', error);
      this.toastService.show(
        'Error al guardar los datos. Por favor intente nuevamente.',
        'error',
        3000
      );
    }
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