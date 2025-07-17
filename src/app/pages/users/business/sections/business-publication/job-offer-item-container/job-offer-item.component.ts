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
  @Output() edit = new EventEmitter<any>();

  // Estado para controlar la expansión de texto
  showFullDescription = false;
  showFullRequirements = false;
  private clickListener: (() => void) | null = null;

  // Limites de caracteres
  private readonly MAX_PREVIEW_LENGTH = 25;
  private readonly MAX_FULL_LENGTH = 1000;

  // Obtener texto recortado para vista previa
  getPreviewText(text: string | undefined): string {
    if (!text) return '';
    return text.length > this.MAX_PREVIEW_LENGTH 
      ? text.slice(0, this.MAX_PREVIEW_LENGTH) + '...' 
      : text;
  }

  // Obtener texto completo con límite
  getFullText(text: string | undefined): string {
    if (!text) return '';
    return text.length > this.MAX_FULL_LENGTH 
      ? text.slice(0, this.MAX_FULL_LENGTH) + '...' 
      : text;
  }

  // Ver si el texto es más largo que el límite de vista previa
  isTextLong(text: string | undefined): boolean {
    return text ? text.length > this.MAX_PREVIEW_LENGTH : false;
  }

  // Manejar clic en ver más/menos
  toggleShowMore(section: 'description' | 'requirements', event: MouseEvent): void {
    event.stopPropagation();
    
    if (section === 'description') {
      this.showFullDescription = !this.showFullDescription;
    } else {
      this.showFullRequirements = !this.showFullRequirements;
    }

    // Configurar listener para cerrar al hacer clic fuera
    this.setupOutsideClickListener();
  }

  // Configurar listener para cerrar al hacer clic fuera
  private setupOutsideClickListener(): void {
    // Remover listener anterior si existe
    this.removeOutsideClickListener();

    // Agregar nuevo listener
    this.clickListener = () => {
      this.showFullDescription = false;
      this.showFullRequirements = false;
      this.removeOutsideClickListener();
    };

    // Usar setTimeout para evitar que el clic actual active el listener
    setTimeout(() => {
      document.addEventListener('click', this.clickListener!);
    }, 0);
  }

  // Remover listener
  private removeOutsideClickListener(): void {
    if (this.clickListener) {
      document.removeEventListener('click', this.clickListener);
      this.clickListener = null;
    }
  }

  // Limpiar listener al destruir el componente
  ngOnDestroy(): void {
    this.removeOutsideClickListener();
  }

  // Formatear la fecha para mostrarla de manera legible
  formatDate(dateString: string): string {
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return new Date(dateString).toLocaleDateString('es-ES', options);
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
    this.edit.emit(this.jobOffer);
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
