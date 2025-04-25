import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { FirebaseService } from '../../../../../../../../../shared/services/firebase.service';
import { User } from '@angular/fire/auth';
import { AboutMeInfoComponent } from './about-me-info/about-me-info.component';
import { ToastService } from '../../../../../../../../../shared/services/toast.service';
import { ConfirmationModalService } from '../../../../../../../../../shared/services/confirmation-modal.service';

@Component({
  selector: 'app-edit-about-me',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, AboutMeInfoComponent],
  templateUrl: './edit-about-me.component.html',
  styleUrls: ['./edit-about-me.component.css'],
})
export class EditAboutMeComponent implements OnInit {
  @Input() currentUser: User | null = null;
  profileForm!: FormGroup;
  userEmail: string | null = null;
  editableFields: { [key: string]: boolean } = {};
  isFormDirty = false;
  showSaveButton = false;
  originalData: { [key: string]: any } = {};
  showInfoComponent = false;

  constructor(
    private fb: FormBuilder,
    private firebaseService: FirebaseService,
    private toastService: ToastService,
    private confirmationModal: ConfirmationModalService
  ) {}

  // Método de inicialización del componente
  ngOnInit(): void {
    this.initializeForm();
    this.setEditableFields();

    // Obtener el email del usuario autenticado
    if (this.currentUser && this.currentUser.email) {
      this.userEmail = this.currentUser.email.replace(/\./g, '_');
      this.loadUserData();
    } else {
      this.toastService.show('Usuario no autenticado o sin email', 'error');
    }

    // Detectar cambios en el formulario
    this.profileForm.valueChanges.subscribe(() => {
      this.isFormDirty = this.profileForm.dirty;

      // Mostrar u ocultar el botón de guardar basado en cambios válidos
      if (this.editableFields['aboutMe']) {
        this.showSaveButton = this.isFormDirty && 
                            this.profileForm.valid && 
                            this.profileForm.get('aboutMe')?.value !== this.originalData['aboutMe'];
      }
    });
  }

  // Método para inicializar el formulario
  private initializeForm(): void {
    this.profileForm = this.fb.group({
      aboutMe: [''],
    });
  }

  // Método para establecer los campos editables
  private setEditableFields(): void {
    this.editableFields = {
      aboutMe: false
    };
  }

  // Método para cargar los datos del usuario
  private async loadUserData(): Promise<void> {
    if (!this.userEmail) {
      this.toastService.show('Error: Usuario no autenticado', 'error');
      return;
    }

    try {
      // Obtener datos del usuario
      const userData = await this.firebaseService.getUserData(this.userEmail);
      const aboutMe = userData?.profileData?.aboutMe || '';

      // Cargar datos en el formulario y guardar datos originales
      this.profileForm.patchValue({ aboutMe });
      this.originalData['aboutMe'] = aboutMe; // Guardar datos originales
      this.profileForm.markAsPristine(); // Reinicia el estado "dirty"
      this.isFormDirty = false;
    } catch (error) {
      console.error('Error al cargar datos:', error);
      this.toastService.show('Error al cargar los datos del usuario', 'error');
    }
  }

  // Método para ajustar la altura del textarea al iniciar
  adjustTextareaHeightOnInit(field: string): void {
    if (field === 'aboutMe') {
      const textarea = document.querySelector(
        'textarea[formControlName="aboutMe"]'
      ) as HTMLTextAreaElement;
      if (textarea) {
        this.adjustTextareaHeight(textarea);
        textarea.addEventListener('input', () => this.adjustTextareaHeight(textarea));
      }
    }
  }

  // Método para ajustar la altura del textarea
  adjustTextareaHeight(textarea: HTMLTextAreaElement): void {
    textarea.style.height = 'auto'; // Restablece la altura
    textarea.style.height = `${textarea.scrollHeight}px`; // Ajusta al contenido
  }

  // Método para alternar el modo de edición
  toggleEdit(field: string): void {
    this.editableFields[field] = !this.editableFields[field];

    if (this.editableFields[field]) {
      // Modo edición activado
      this.showSaveButton = false; // Inicialmente oculto hasta que haya cambios
      setTimeout(() => this.adjustTextareaHeightOnInit(field), 0);
    } else {
      // Cancelar edición, restaurar datos originales
      if (this.originalData[field] !== undefined) {
        this.profileForm.get(field)?.setValue(this.originalData[field]);
        this.profileForm.markAsPristine();
      }
      this.showSaveButton = false; // Ocultar el botón Guardar
    }
  }

  // Método para guardar los cambios
  async onSubmit(): Promise<void> {
    // Verificación en capas para mejor depuración
    if (!this.userEmail) {
      this.toastService.show('Debes iniciar sesión para guardar cambios', 'error');
      return;
    }

    // Validación del formulario
    if (!this.profileForm.valid) {
      this.toastService.show(
        'Por favor completa el campo "Sobre mí" correctamente (mínimo 10 caracteres)',
        'error'
      );
      return;
    }

    // Verificar si hay cambios reales
    if (!this.isFormDirty || this.profileForm.get('aboutMe')?.value === this.originalData['aboutMe']) {
      return;
    }

        // Mostrar modal de confirmación antes de guardar
    this.confirmationModal.show(
      {
        title: 'Confirmar cambios',
        message: '¿Estás seguro que deseas guardar los cambios en tu información "Sobre mí"?',
        confirmText: 'Guardar',
        cancelText: 'Cancelar'
      },
      () => this.saveChanges(),
      () => this.toastService.show('Guardado cancelado', 'info')
    );
  }

  private async saveChanges(): Promise<void> {
    try {
      // Obtener los datos actuales de profileData
      const userData = await this.firebaseService.getUserData(this.userEmail!);
      const currentProfileData = userData?.profileData || {};

      // Actualizar únicamente el campo aboutMe
      const updatedProfileData = {
        ...currentProfileData,
        aboutMe: this.profileForm.value.aboutMe
      };

      // Guardar los datos actualizados en la base de datos
      await this.firebaseService.updateUserData(this.userEmail!, {
        profileData: updatedProfileData
      });

      // Actualizar el estado interno después del guardado exitoso
      this.originalData['aboutMe'] = this.profileForm.value.aboutMe;
      this.profileForm.markAsPristine();
      this.isFormDirty = false;
      this.editableFields['aboutMe'] = false;
      this.showSaveButton = false;

      this.toastService.show('Tu información se ha guardado correctamente', 'success');
    } catch (error) {
      console.error('Error al guardar:', error);
      this.toastService.show(
        'Ocurrió un error al guardar. Por favor intenta nuevamente.',
        'error'
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