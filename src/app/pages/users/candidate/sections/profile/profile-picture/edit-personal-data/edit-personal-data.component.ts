import { Component, Input, OnInit, OnDestroy, Output, EventEmitter, inject } from '@angular/core';
import { EnvironmentInjector, runInInjectionContext } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Database, ref, get, set } from '@angular/fire/database';
import { Subscription } from 'rxjs';
import { ConfirmationModalService } from 'src/app/shared/components/confirmation-modal/confirmation-modal.service';
import { ToastService } from 'src/app/shared/components/toast/toast.service';
import { PersonalDataInfoComponent } from './personal-data-info/personal-data-info.component';
import { CvEditButtonRowComponent } from '../../gallery/cv-grid/cv-edit-button/cv-edit-button-row/cv-edit-button-row.component';
import { User } from '@angular/fire/auth';
import { PersonalDataService } from 'src/app/pages/users/candidate/services/personal-data.service';
import { ProfileService } from 'src/app/pages/users/candidate/services/profile.service';
import { FirebaseService } from 'src/app/shared/services/firebase.service';

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
  @Input() isExample: boolean = false;
  @Input() exampleId: string | null = null;
  @Output() saved = new EventEmitter<boolean>();
  @Output() canceled = new EventEmitter<void>();

  profileForm!: FormGroup;
  isEditing: boolean = false;
  formHasChanges: boolean = false;
  private initialFormValue: any;
  private formSubscription: Subscription | null = null;
  private injector = inject(EnvironmentInjector);
  private db = inject(Database);
  private firebaseService = inject(FirebaseService);

  countries = [
    { code: 'Panama', name: 'Panamá' },
    { code: 'Argentina', name: 'Argentina' },
    { code: 'Bolivia', name: 'Bolivia' },
    { code: 'Brazil', name: 'Brasil' },
    { code: 'Chile', name: 'Chile' },
    { code: 'Colombia', name: 'Colombia' },
    { code: 'Costa Rica', name: 'Costa Rica' },
    { code: 'Cuba', name: 'Cuba' },
    { code: 'Ecuador', name: 'Ecuador' },
    { code: 'El Salvador', name: 'El Salvador' },
    { code: 'España', name: 'España' },
    { code: 'USA', name: 'Estados Unidos' },
    { code: 'Guatemala', name: 'Guatemala' },
    { code: 'Honduras', name: 'Honduras' },
    { code: 'Nicaragua', name: 'Nicaragua' },
    { code: 'Mexico', name: 'México' },
    { code: 'Paraguay', name: 'Paraguay' },
    { code: 'Peru', name: 'Perú' },
    { code: 'Puerto Rico', name: 'Puerto Rico' },
    { code: 'Rep. Dominicana', name: 'República Dominicana' },
    { code: 'Uruguay', name: 'Uruguay' },
    { code: 'Venezuela', name: 'Venezuela' },
  ];

  constructor(
    private fb: FormBuilder,
    // private firebaseService: FirebaseService,
    private personalDataService: PersonalDataService,
    private profileService: ProfileService,
    private confirmationModal: ConfirmationModalService,
    private toastService: ToastService,
    // private db: Database
  ) { }

  ngOnInit(): void {
    this.initializeForm();
    this.loadData();
  }

  ngOnChanges(changes: any): void {
    if (changes.exampleId || changes.isExample) {
      this.loadData();
    }
  }

  private loadData(): void {
    if (this.currentUser || (this.isExample && this.exampleId)) {
      this.loadUserData();
    }
  }

  ngOnDestroy(): void {
    this.formSubscription?.unsubscribe();
  }

  private initializeForm(): void {
    this.profileForm = this.fb.group({
      fullName: [{ value: '', disabled: true }, [Validators.required, Validators.minLength(3)]],
      profesion: [{ value: '', disabled: true }, [Validators.required]],
      phone: [{ value: '', disabled: true }, [Validators.pattern(/^\d{4}-\d{4}$/), Validators.minLength(8)]],
      editableEmail: [{ value: '', disabled: true }, [Validators.required, Validators.email]],
      direction: [{ value: '', disabled: true }, [Validators.required, Validators.minLength(3)]],
      country: [{ value: '', disabled: true }, [Validators.required]],
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
    return runInInjectionContext(this.injector, async () => {
      try {
        let personalData;

        if (this.isExample && this.exampleId) {
          // Cargar datos del ejemplo desde Firebase
          const examplePath = `cv-app/examples/${this.exampleId}`;
          const exampleRef = ref(this.db, examplePath);
          const snapshot = await get(exampleRef);

          if (snapshot.exists()) {
            const exampleData = snapshot.val();

            // Mapear los datos del ejemplo al formato del formulario
            personalData = {
              fullName: exampleData?.profileData?.personalData?.fullName || '',
              profesion: exampleData?.profileData?.personalData?.profesion || '',
              phone: exampleData?.profileData?.personalData?.phone || '',
              editableEmail: exampleData?.profileData?.personalData?.editableEmail || '',
              direction: exampleData?.profileData?.personalData?.direction || '',
              country: exampleData?.metadata?.country || '',
            };
          } else {
            console.warn('EditPersonalData - No se encontraron datos para el ejemplo con ID:', this.exampleId);
            personalData = {};
          }
        } else {
          personalData = await this.personalDataService.loadUserData(this.currentUser);
        }

        // Actualizar el formulario con los datos cargados
        if (personalData) {
          this.profileForm.patchValue(personalData);
          this.initialFormValue = JSON.parse(JSON.stringify(this.profileForm.value));
        }
      } catch (error) {
        console.error('Error loading user data:', error);
        this.toastService.show('Error al cargar los datos del usuario', 'error', 3000);
      }
    });
  }

  toggleEdit(): void {
    if (!this.isEditing) {
      this.isEditing = true;
      this.initialFormValue = JSON.parse(JSON.stringify(this.profileForm.value));
      this.formHasChanges = false;

      // Habilitar todos los controles al entrar en modo edición
      this.profileForm.enable();

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

    // Deshabilitar todos los controles al cancelar
    this.profileForm.disable();

    this.formSubscription?.unsubscribe();
    this.formSubscription = null;
    this.toastService.show('Modo edición deshabilitado', 'error');
  }

  async onSubmit(): Promise<void> {
    return runInInjectionContext(this.injector, async () => {
      if (this.isExample) {
        if (!this.exampleId) {
          console.error('Error: Modo ejemplo activado pero no se proporcionó exampleId');
          this.toastService.show('Error de configuración del ejemplo', 'error', 3000);
          return;
        }
      } else if (!this.currentUser?.email) {
        console.error('Error: Usuario no autenticado - currentUser:', this.currentUser);
        this.toastService.show('Usuario no autenticado.', 'error', 3000);
        return;
      }

      if (!this.profileForm.valid) {
        this.toastService.show('Por favor complete todos los campos requeridos correctamente.', 'error', 3000);
        return;
      }

      try {
        const updatedData = {
          profileData: {
            personalData: {
              fullName: this.profileForm.value.fullName,
              profesion: this.profileForm.value.profesion,
              phone: this.profileForm.value.phone,
              editableEmail: this.profileForm.value.editableEmail,
              direction: this.profileForm.value.direction
            }
          },
          metadata: {
            country: this.profileForm.value.country
          }
        };

        if (this.isExample && this.exampleId) {
          // Operaciones de Firebase para modo ejemplo
          const examplePath = `cv-app/examples/${this.exampleId}`;
          const exampleRef = ref(this.db, examplePath);

          const snapshot = await get(exampleRef);
          const currentData = snapshot.val() || {};

          const updatedExampleData = {
            ...currentData,
            profileData: {
              ...(currentData.profileData || {}),
              personalData: {
                ...(currentData.profileData?.personalData || {}),
                fullName: this.profileForm.value.fullName,
                profesion: this.profileForm.value.profesion,
                phone: this.profileForm.value.phone,
                editableEmail: this.profileForm.value.editableEmail,
                direction: this.profileForm.value.direction
              }
            },
            metadata: {
              ...(currentData.metadata || {}),
              country: this.profileForm.value.country,
              lastUpdated: new Date().toISOString()
            }
          };

          await set(exampleRef, updatedExampleData);
          this.toastService.show('Datos de ejemplo actualizados correctamente!', 'success', 3000);
          this.saved.emit(true); // Emitir éxito
        } else if (this.currentUser?.email) {
          // Usar el FirebaseService para usuarios reales
          await this.firebaseService.updateUserData(this.currentUser.email, updatedData);
          this.profileService.notifyPersonalDataUpdate(this.profileForm.value);
          this.toastService.show('Datos actualizados exitosamente!', 'success', 3000);
          this.saved.emit(true); // Emitir éxito
        }

        // Resetear estado del formulario
        this.resetFormState();
      } catch (error) {
        console.error('Error al guardar los datos:', error);
        this.toastService.show(
          `Error al guardar los datos: ${error instanceof Error ? error.message : 'Intente nuevamente'}`,
          'error',
          3000
        );
        this.saved.emit(false); // Emitir fallo
      }
    });
  }

  private resetFormState(): void {
    this.initialFormValue = JSON.parse(JSON.stringify(this.profileForm.value));
    this.isEditing = false;
    this.formHasChanges = false;
    this.formSubscription?.unsubscribe();
    this.formSubscription = null;
    this.profileForm.disable();
  }
}