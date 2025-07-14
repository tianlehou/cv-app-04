import { CommonModule } from '@angular/common';
import { Component, Input, Output, EventEmitter, inject, NgZone } from '@angular/core';
import { User } from '@angular/fire/auth';
import { ConfirmationModalService } from 'src/app/shared/services/confirmation-modal.service';
import { ToastService } from 'src/app/shared/services/toast.service';

@Component({
  selector: 'app-job-offer-item',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './job-offer-item.component.html',
  styleUrls: ['./job-offer-item.component.css']
})
export class JobOfferItemComponent {
  @Input() jobOffer: any;
  @Input() currentUser: User | null = null;
  @Input() isOwner: boolean = false;
  @Output() deleted = new EventEmitter<string>();
  @Output() edit = new EventEmitter<string>();

  // Formatear la fecha para mostrarla de manera legible
  formatDate(dateString: string): string {
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return new Date(dateString).toLocaleDateString('es-ES', options);
  }

  // Formatear el salario con separadores de miles
  formatSalary(salary: number): string {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(salary);
  }

  // Obtener el texto de la modalidad
  getModalityLabel(modality: string): string {
    const modalities: { [key: string]: string } = {
      'presencial': 'Presencial',
      'remoto': 'Remoto',
      'hibrido': 'Híbrido'
    };
    return modalities[modality] || modality;
  }

  // Obtener el texto del tipo de contrato
  getContractTypeLabel(type: string): string {
    const types: { [key: string]: string } = {
      'indefinido': 'Indefinido',
      'temporal': 'Temporal',
      'practicas': 'Prácticas',
      'formacion': 'Formación'
    };
    return types[type] || type;
  }

  // Obtener el texto de la jornada laboral
  getWorkdayLabel(workday: string): string {
    const workdays: { [key: string]: string } = {
      'completa': 'Jornada Completa',
      'parcial': 'Media Jornada',
      'por-horas': 'Por Horas'
    };
    return workdays[workday] || workday;
  }

  // Manejar la edición de la oferta
  onEdit(): void {
    this.edit.emit(this.jobOffer.id);
  }

  private confirmationModalService = inject(ConfirmationModalService);
  private toast = inject(ToastService);
  private ngZone = inject(NgZone);

  // Manejar la eliminación de la oferta
  onDelete(): void {
    this.confirmationModalService.show(
      {
        title: 'Eliminar Oferta',
        message: '¿Estás seguro de que deseas eliminar esta oferta de trabajo?',
        confirmText: 'Eliminar',
        cancelText: 'Cancelar'
      },
      () => {
        this.ngZone.run(() => {
          this.toast.show('Oferta eliminada correctamente', 'success');
          this.deleted.emit(this.jobOffer.id);
        });
      }
    );
  }
}
