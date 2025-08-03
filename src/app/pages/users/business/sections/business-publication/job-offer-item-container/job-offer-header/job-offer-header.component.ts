import { CommonModule } from '@angular/common';
import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { JobOfferMenuComponent } from '../job-offer-menu/job-offer-menu.component';
import { JobOfferService } from '../../services/job-offer.service';
import { ToastService } from 'src/app/shared/components/toast/toast.service';

@Component({
  selector: 'app-job-offer-header',
  standalone: true,
  imports: [CommonModule, FormsModule, JobOfferMenuComponent],
  templateUrl: './job-offer-header.component.html',
  styleUrls: ['./job-offer-header.component.css']
})
export class JobOfferHeaderComponent {
  @Input() jobOffer: any;
  @Input() minDate: string = new Date().toISOString().slice(0, 16);

  // Estado interno para manejar la edición
  editingDeadline: boolean = false;
  newDeadline: string = '';

  // Eventos
  @Output() onInfo = new EventEmitter<void>();
  @Output() onDuplicate = new EventEmitter<void>();
  @Output() onEdit = new EventEmitter<void>();
  @Output() onDelete = new EventEmitter<void>();
  @Output() onPublish = new EventEmitter<void>();
  @Output() onCancelPublish = new EventEmitter<void>();
  @Output() onSaveDeadline = new EventEmitter<string>();
  @Output() onCancelEditDeadline = new EventEmitter<void>();

  // Inyectar servicios
  private toast = inject(ToastService);
  private jobOfferService = inject(JobOfferService);

  // Iniciar la edición de la fecha de vencimiento
  startEditingDeadline(): void {
    // Convertir la fecha ISO a formato YYYY-MM-DD para el input date
    if (this.jobOffer.deadline) {
      const date = new Date(this.jobOffer.deadline);
      this.newDeadline = date.toISOString().split('T')[0];
    } else {
      // Si no hay fecha, usar la fecha actual
      this.newDeadline = new Date().toISOString().split('T')[0];
    }
    this.editingDeadline = true;
  }

  // Cancelar la edición
  cancelEditDeadline(): void {
    this.editingDeadline = false;
    this.onCancelEditDeadline.emit();
  }

  // Guardar la fecha de vencimiento
  saveDeadline(): void {
    const deadline = this.newDeadline;

    if (!deadline) {
      this.toast.show('Por favor ingresa una fecha válida', 'error');
      return;
    }

    // Crear fecha a medianoche para comparación
    const deadlineDate = new Date(deadline);
    const now = new Date();
    now.setHours(0, 0, 0, 0); // Establecer a medianoche para comparar solo fechas

    if (deadlineDate < now) {
      this.toast.show('La fecha de vencimiento debe ser hoy o en el futuro', 'error');
      return;
    }

    // Establecer la hora a las 23:59:59 del día seleccionado
    deadlineDate.setHours(23, 59, 59, 999);

    this.jobOfferService.updateJobOffer(this.jobOffer.id, {
      deadline: deadlineDate.toISOString(),
      updatedAt: new Date().toISOString()
    } as any).subscribe({
      next: (response: any) => {
        if (this.jobOffer) {
          this.jobOffer.deadline = deadlineDate.toISOString();
        }
        this.editingDeadline = false;
        this.toast.show('Fecha de vencimiento actualizada correctamente', 'success');
        // Notificar al componente padre que se guardó correctamente
        this.onSaveDeadline.emit(deadlineDate.toISOString());
      },
      error: (error: any) => {
        console.error('Error al actualizar la fecha de vencimiento:', error);
        this.toast.show('Error al actualizar la fecha de vencimiento', 'error');
      }
    });
  }

  // Formatear fecha para mostrarla de manera legible
  formatDate(dateString: string | undefined | null): string {
    if (!dateString) return 'No especificada';

    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        throw new Error('Fecha inválida');
      }
      return date.toLocaleDateString('es', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
    } catch (error) {
      console.error('Error al formatear fecha:', error);
      try {
        return new Date(dateString).toISOString().split('T')[0];
      } catch (e) {
        return dateString;
      }
    }
  }
}
