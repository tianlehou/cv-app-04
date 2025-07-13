import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { JobOfferService } from '../job-offer.service';
import { JobOffer } from '../job-offer.model';
import { AuthService } from 'src/app/pages/home/auth/auth.service';
import { ConfirmationModalService } from 'src/app/shared/services/confirmation-modal.service';
import { ToastService } from 'src/app/shared/services/toast.service';

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
export class PublicationFormComponent implements OnInit {
  jobForm!: FormGroup;
  isSubmitting = false;
  showAlert = false;
  alertMessage = '';
  alertType: 'success' | 'error' | 'info' | 'warning' = 'info';

  // Fecha mínima para el selector de fechas
  minDate: string;

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
  private router = inject(Router);
  private fb = inject(FormBuilder);
  
  constructor() {
    // Establecer la fecha mínima como hoy
    const today = new Date();
    this.minDate = today.toISOString().split('T')[0];
  }

  ngOnInit(): void {
    // Configurar fecha mínima (hoy)
    const today = new Date();
    this.minDate = today.toISOString().split('T')[0];
    
    this.initForm();
  }

  // Limpiar suscripciones al destruir el componente
  ngOnDestroy(): void {
    // No es necesario limpiar nada ya que el servicio de confirmación maneja sus propias suscripciones
  }

  private initForm(): void {
    this.jobForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(5)]],
      description: ['', [Validators.required, Validators.minLength(20)]],
      requirements: ['', [Validators.required, Validators.minLength(20)]],
      contractType: ['', Validators.required],
      workday: ['', Validators.required],
      salary: ['', [Validators.required, Validators.min(0)]],
      deadline: ['', [Validators.required, this.futureDateValidator.bind(this)]],
      location: ['', [Validators.required, Validators.minLength(3)]],
      modality: ['', Validators.required]
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
      this.showMessage('Por favor, completa correctamente todos los campos obligatorios.', 'error');
      return;
    }

    this.isSubmitting = true;
    
    // Obtener el usuario actual
    const currentUser = this.authService.getCurrentAuthUser();
    if (!currentUser) {
      this.showMessage('Debes iniciar sesión para publicar una oferta', 'error');
      this.isSubmitting = false;
      return;
    }

    try {
      const jobOffer: JobOffer = {
        ...this.jobForm.value,
        companyId: currentUser.uid,
        companyName: currentUser.displayName || 'Empresa',
        publicationDate: new Date().toISOString(),
        status: 'active',
        requiredSkills: this.extractSkills(this.jobForm.get('requirements')?.value || ''),
        applications: 0,
        views: 0
      };

      this.jobOfferService.createJobOffer(jobOffer).subscribe({
        next: () => {
          this.showMessage('Oferta publicada exitosamente', 'success');
          this.jobForm.reset();
          this.router.navigate(['/business/dashboard']);
        },
        error: (error: Error) => {
          console.error('Error al publicar la oferta:', error);
          this.showMessage('Error al publicar la oferta. Por favor, inténtalo de nuevo.', 'error');
          this.isSubmitting = false;
        },
        complete: () => {
          this.isSubmitting = false;
        }
      });
    } catch (error) {
      console.error('Error inesperado:', error);
      this.showMessage('Ocurrió un error inesperado. Por favor, inténtalo de nuevo.', 'error');
      this.isSubmitting = false;
    }
  }

  private extractSkills(requirements: string): string[] {
    if (!requirements) return [];
    
    // Palabras clave comunes en habilidades
    const skillKeywords = [
      'javascript', 'typescript', 'angular', 'react', 'vue', 'node', 'python', 'java', 'c#', 'c++',
      'html', 'css', 'sass', 'less', 'git', 'docker', 'aws', 'azure', 'sql', 'nosql', 'mongodb',
      'express', 'nestjs', 'graphql', 'rest', 'api', 'testing', 'jest', 'cypress', 'ci/cd', 'agile',
      'JavaScript', 'TypeScript', 'Angular', 'React', 'Vue', 'Node.js', 'Python', 'Java',
      'SQL', 'NoSQL', 'Git', 'Docker', 'AWS', 'Azure', 'HTML', 'CSS', 'SCSS', 'Responsive', 'Design'
    ];
    
    const words = requirements.toLowerCase().split(/\s+/);
    return [...new Set(words.filter(word => 
      skillKeywords.some((skill: string) => word.includes(skill.toLowerCase()))
    ))].slice(0, 5); // Limitar a 5 habilidades
  }

  // Mostrar mensaje de feedback al usuario
  private showMessage(message: string, type: 'success' | 'error'): void {
    this.alertMessage = message;
    this.alertType = type;
    this.showAlert = true;
    
    // Hacer scroll al inicio para ver el mensaje
    window.scrollTo(0, 0);
    
    // Ocultar el mensaje después de 5 segundos
    setTimeout(() => {
      this.showAlert = false;
    }, 5000);
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

  // Reiniciar los campos del formulario
  private resetFormFields(): void {
    this.jobForm.reset({
      contractType: '',
      workday: '',
      modality: '',
      salary: null,
      deadline: ''
    });
    
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
