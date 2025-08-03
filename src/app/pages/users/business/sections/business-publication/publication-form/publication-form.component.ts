import { Component, OnInit, Output, EventEmitter, inject, NgZone, Input, OnChanges, SimpleChanges, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import { JobOfferService } from '../services/job-offer.service';
import { JobOffer } from '../job-offer.model';
import { AuthService } from 'src/app/pages/home/auth/auth.service';
import { ConfirmationModalService } from 'src/app/shared/components/confirmation-modal/confirmation-modal.service';
import { ToastService } from 'src/app/shared/components/toast/toast.service';

@Component({
  selector: 'app-publication-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule
  ],
  templateUrl: './publication-form.component.html',
  styleUrls: ['./publication-form.component.css']
})
export class PublicationFormComponent implements OnInit, OnChanges, OnDestroy {
  // Constantes para los límites de caracteres
  readonly MAX_DESCRIPTION_LENGTH = 1000;
  readonly MAX_REQUIREMENTS_LENGTH = 1000;
  
  @Input() jobOffer: JobOffer | null = null;
  @Input() isEditing = false;
  
  jobForm!: FormGroup;
  isSubmitting = false;
  isFormPristine = true; // Para rastrear si el formulario está en su estado inicial
  
  // Contadores de caracteres
  descriptionLength = 0;
  requirementsLength = 0;
  
  // Evento que se emite cuando se guarda exitosamente
  @Output() saved = new EventEmitter<boolean>();

  // Fecha mínima para el selector de fechas
  minDate: string;

  // Formatear salario con comas para miles, punto para decimales y 2 decimales
  formatSalary(salary: number | null): string {
    if (salary === null) return '';
    
    // Formatear el número con comas para miles y punto para decimales
    return salary.toFixed(2)
      .toString()
      .replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

  // Formatear el valor del input mientras se escribe
  formatSalaryInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    let value = input.value.replace(/[^0-9.]/g, ''); // Solo números y puntos
    
    // Si hay más de un punto, mantener solo el último
    const decimalSplit = value.split('.');
    if (decimalSplit.length > 2) {
      value = `${decimalSplit.slice(0, -1).join('')}.${decimalSplit[decimalSplit.length - 1]}`;
    }
    
    // Actualizar el valor del control del formulario
    this.jobForm.patchValue({
      salary: value
    }, { emitEvent: false });
  }

  // Formatear el valor cuando el campo pierde el foco
  onSalaryBlur(event: Event): void {
    const input = event.target as HTMLInputElement;
    let value = input.value;
    
    // Si el valor está vacío, no hacer nada
    if (!value) return;
    
    // Eliminar comas y convertir a número
    const cleanValue = value.replace(/,/g, '');
    const numberValue = parseFloat(cleanValue);
    
    if (!isNaN(numberValue)) {
      // Formatear con comas para miles y punto para decimales
      const formattedValue = this.formatSalary(numberValue);
      this.jobForm.patchValue({
        salary: formattedValue
      }, { emitEvent: false });
    }
  }

  // Opciones para los selectores
  contractTypes = [
    { value: 'indefinido', label: 'Indefinido' },
    { value: 'temporal', label: 'Temporal' },
    { value: 'practicas', label: 'Prácticas' },
    { value: 'formacion', label: 'Formación' }
  ];

  workdayTypes = [
    { value: 'completa', label: 'Jornada Completa' },
    { value: 'parcial', label: 'Media Jornada' },
    { value: 'por-horas', label: 'Por Horas' }
  ];

  modalities = [
    { value: 'presencial', label: 'Presencial' },
    { value: 'remoto', label: 'Remoto' },
    { value: 'hibrido', label: 'Híbrido' }
  ];

  // Servicios inyectados
  private authService = inject(AuthService);
  private jobOfferService = inject(JobOfferService);
  private confirmationModalService = inject(ConfirmationModalService);
  private toastService = inject(ToastService);
  private fb = inject(FormBuilder);
  private ngZone = inject(NgZone);
  
  constructor() {
    // Establecer la fecha mínima como hoy
    const today = new Date();
    this.minDate = today.toISOString().split('T')[0];
  }

  ngOnInit(): void {
    this.initForm();
    if (this.isEditing && this.jobOffer) {
      this.populateForm(this.jobOffer);
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['jobOffer'] && this.jobForm) {
      this.populateForm(changes['jobOffer'].currentValue);
    }
  }

  private populateForm(jobOffer: JobOffer): void {
    this.jobForm.patchValue({
      title: jobOffer.title,
      description: jobOffer.description,
      requirements: jobOffer.requirements,
      contractType: jobOffer.contractType,
      workday: jobOffer.workday,
      salary: jobOffer.salary,
      deadline: jobOffer.deadline.split('T')[0], // Asegurar el formato de fecha
      location: jobOffer.location,
      modality: jobOffer.modality
    });
  }

  // Limpiar suscripciones al destruir el componente
  private destroy$ = new Subject<void>();

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initForm(): void {
    this.jobForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(5)]],
      description: ['', [
        Validators.required, 
        Validators.minLength(20),
        Validators.maxLength(this.MAX_DESCRIPTION_LENGTH)
      ]],
      requirements: ['', [
        Validators.required, 
        Validators.minLength(20),
        Validators.maxLength(this.MAX_REQUIREMENTS_LENGTH)
      ]],
      contractType: ['', Validators.required],
      workday: ['', Validators.required],
      salary: ['', [Validators.required, Validators.min(0)]],
      deadline: ['', [Validators.required, this.futureDateValidator.bind(this)]],
      location: ['', [Validators.required, Validators.minLength(3)]],
      modality: ['', Validators.required]
    });

    // Verificar si el formulario está en su estado inicial (vacío)
    this.updateFormPristineState();
    
    // Suscribirse a los cambios del formulario para actualizar el estado
    this.jobForm.valueChanges.subscribe(() => {
      this.updateFormPristineState();
    });

    // Suscribirse a cambios en los campos de texto para actualizar contadores
    this.jobForm.get('description')?.valueChanges.subscribe((value: string) => {
      this.descriptionLength = value?.length || 0;
    });

    this.jobForm.get('requirements')?.valueChanges.subscribe((value: string) => {
      this.requirementsLength = value?.length || 0;
    });
  }

  // Validador personalizado para fechas futuras
  futureDateValidator(control: AbstractControl): { [key: string]: any } | null {
    if (!control.value) {
      return null; // Permitir que el validador required maneje este caso
    }
    
    const selectedDate = new Date(control.value);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return selectedDate >= today ? null : { futureDate: true };
  }

  onSubmit(): void {
    // Marcar todos los controles como tocados para mostrar errores
    this.markFormGroupTouched(this.jobForm);
    
    if (this.jobForm.invalid) {
      this.toastService.show('Por favor, completa correctamente todos los campos obligatorios.', 'error');
      return;
    }

    // Mostrar confirmación antes de guardar
    this.confirmationModalService.show(
      {
        title: 'Confirmar Cambios',
        message: '¿Estás seguro de que deseas guardar estos cambios?',
        confirmText: 'Sí, guardar',
        cancelText: 'Cancelar'
      },
      () => this.saveJobOffer(), // Función que se ejecuta al confirmar
      () => this.toastService.show('Publicación cancelada', 'info') // Función que se ejecuta al cancelar
    );
  }

  private handleSaveSuccess(id: string): void {
    this.ngZone.run(() => {
      const message = this.isEditing 
        ? 'Oferta actualizada exitosamente' 
        : 'Oferta publicada exitosamente';
      this.toastService.show(message, 'success');
      this.saved.emit(true);
      if (!this.isEditing) {
        this.jobForm.reset();
      }
    });
  }

  private handleSaveError(error: any): void {
    console.error('Error al guardar la oferta:', error);
    const message = this.isEditing
      ? 'Error al actualizar la oferta: '
      : 'Error al guardar la oferta: ';
    this.toastService.show(message + (error.message || ''), 'error');
    this.isSubmitting = false;
  }

  private handleSaveComplete(): void {
    this.isSubmitting = false;
  }

  private async saveJobOffer(): Promise<void> {
    this.isSubmitting = true;
    
    // Obtener el usuario actual
    const currentUser = this.authService.getCurrentAuthUser();
    if (!currentUser) {
      this.toastService.show('Debes iniciar sesión para publicar una oferta', 'error');
      this.isSubmitting = false;
      return;
    }

    try {
      // Obtener el nombre de la empresa
      const companyName = await this.jobOfferService.getCompanyName(currentUser.uid);
      const jobOfferData: any = {
        ...this.jobForm.value,
        updatedAt: new Date().toISOString(),
        applications: 0,
        views: 0
      };

      // Si es una edición, mantener el ID y la fecha de publicación original
      if (this.isEditing && this.jobOffer) {
        jobOfferData.id = this.jobOffer.id;
        jobOfferData.publicationDate = this.jobOffer.publicationDate;
        jobOfferData.companyId = this.jobOffer.companyId;
        jobOfferData.companyName = this.jobOffer.companyName;
        // Usar un tipo any para evitar errores con la propiedad status
        jobOfferData.status = (this.jobOffer as any).status || 'active';
      } else {
        jobOfferData.companyId = currentUser.uid;
        jobOfferData.companyName = companyName || currentUser.displayName;
        jobOfferData.status = 'borrador';
      }

      // Guardar o actualizar la oferta de trabajo
      if (this.isEditing && this.jobOffer && jobOfferData.id) {
        // Actualizar oferta existente
        this.jobOfferService.updateJobOffer(jobOfferData.id, jobOfferData).subscribe({
          next: () => this.handleSaveSuccess(jobOfferData.id!),
          error: (error: any) => this.handleSaveError(error),
          complete: () => this.handleSaveComplete()
        });
      } else {
        // Crear nueva oferta
        this.jobOfferService.createJobOffer(jobOfferData as JobOffer).subscribe({
          next: (id: string) => this.handleSaveSuccess(id),
          error: (error: any) => this.handleSaveError(error),
          complete: () => this.handleSaveComplete()
        });
      }
    } catch (error) {
      console.error('Error inesperado:', error);
      this.toastService.show('Ocurrió un error inesperado. Por favor, inténtalo de nuevo.', 'error');
      this.isSubmitting = false;
      this.saved.emit(false);
    }
  }



  // Reiniciar el formulario con confirmación
  resetForm(): void {
    // Verificar si el formulario tiene cambios sin guardar
    if (this.jobForm.dirty) {
      this.confirmationModalService.show(
        {
          title: 'Confirmar acción',
          message: '¿Estás seguro de que deseas descartar los cambios? Los datos no guardados se perderán.',
          confirmText: 'Sí, descartar',
          cancelText: 'Cancelar'
        },
        () => this.confirmResetForm()
      );
    } else {
      // Si no hay cambios, simplemente reiniciar
      this.resetFormFields();
    }
  }

  private confirmResetForm(): void {
    this.resetFormFields();
    this.toastService.show('Los cambios han sido descartados, el formulario ha sido reiniciado.', 'success');
  }

  // Método para actualizar el estado de isFormPristine
  private updateFormPristineState(): void {
    const formValue = this.jobForm.value;
    this.isFormPristine = Object.values(formValue).every(value => {
      // Considerar vacío: null, undefined, string vacío o array vacío
      return value === null || value === undefined || value === '' || 
             (Array.isArray(value) && value.length === 0);
    });
  }

  // Reiniciar los campos del formulario
  private resetFormFields(): void {
    this.jobForm.reset({
      contractType: '',
      workday: '',
      modality: '',
      salary: null,
      deadline: ''
    });
    this.updateFormPristineState();
    // Marcar como no tocado y sin errores
    this.jobForm.markAsPristine();
    this.jobForm.markAsUntouched();
    this.jobForm.updateValueAndValidity();
  }

  // Mostrar modal de confirmación para reiniciar el formulario
  onReset(): void {
    if (this.jobForm.dirty || this.jobForm.touched) {
      this.confirmationModalService.show(
        {
          title: 'Confirmar reinicio',
          message: '¿Estás seguro de que deseas reiniciar el formulario? Se perderán todos los cambios no guardados.',
          confirmText: 'Sí, reiniciar',
          cancelText: 'Cancelar'
        },
        () => this.confirmReset()
      );
    } else {
      this.jobForm.reset();
    }
  }

  private confirmReset(): void {
    this.jobForm.reset();
    this.toastService.show('Formulario reiniciado correctamente', 'success');
  }

  // Marcar todos los campos como tocados para mostrar errores de validación
  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }
}
