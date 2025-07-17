import { CommonModule } from '@angular/common';
import { Component, Input, Output, EventEmitter, inject, NgZone } from '@angular/core';
import { JobOfferInfoModalComponent } from './job-offer-info-modal/job-offer-info-modal.component';
import { User } from '@angular/fire/auth';
import { ConfirmationModalService } from 'src/app/shared/services/confirmation-modal.service';
import { ToastService } from 'src/app/shared/services/toast.service';
import { JobOfferService } from '../job-offer.service';
import { JobOffer } from '../job-offer.model';

@Component({
  selector: 'app-job-offer-item',
  standalone: true,
  imports: [CommonModule, JobOfferInfoModalComponent],
  templateUrl: './job-offer-item.component.html',
  styleUrls: ['./job-offer-item.component.css']
})
export class JobOfferItemComponent {
  @Input() jobOffer: any;
  @Input() currentUser: User | null = null;
  @Input() isOwner: boolean = false;
  @Output() deleted = new EventEmitter<string>();
  @Output() edit = new EventEmitter<any>();
  @Output() duplicated = new EventEmitter<any>();

  isMenuOpen = false;
  isDuplicating = false;

  // Estado para controlar la expansión de texto
  showFullDescription = false;
  showFullRequirements = false;
  private clickListener: (() => void) | null = null;
  private menuClickListener: (() => void) | null = null;

  // Inyectar servicios necesarios
  private confirmationModalService = inject(ConfirmationModalService);
  private toast = inject(ToastService);
  private ngZone = inject(NgZone);
  private jobOfferService = inject(JobOfferService);

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

  // Métodos para manejar el menú desplegable
  toggleMenu(event: Event): void {
    event.stopPropagation();
    this.isMenuOpen = !this.isMenuOpen;

    if (this.isMenuOpen) {
      // Cerrar el menú al hacer clic fuera de él
      setTimeout(() => {
        this.menuClickListener = () => {
          this.isMenuOpen = false;
          this.removeClickListener();
        };
        document.addEventListener('click', this.menuClickListener);
      });
    } else {
      this.removeClickListener();
    }
  }

  private removeClickListener(): void {
    if (this.menuClickListener) {
      document.removeEventListener('click', this.menuClickListener);
      this.menuClickListener = null;
    }
  }

  //==============================
  // Estado para controlar la visibilidad del modal de información
  showInfoModal = false;

  // Abrir el modal de información
  openInfoModal(): void {
    this.showInfoModal = true;
    this.isMenuOpen = false; // Cerrar el menú popover
  }

  // Cerrar el modal de información
  closeInfoModal(event?: MouseEvent): void {
    if (event) {
      event.stopPropagation();
    }
    this.showInfoModal = false;
  }

  // Manejar el cierre del modal desde el componente hijo
  onInfoModalClose(): void {
    this.showInfoModal = false;
  }
  //==============================

  // Manejar cuando el mouse sale del componente
  onMouseLeave(): void {
    if (this.isMenuOpen) {
      this.isMenuOpen = false;
      this.removeClickListener();
    }
  }

  // Manejar clic en editar
  // Este método emite el evento de edición con la oferta de trabajo
  onEdit(): void {
    this.edit.emit(this.jobOffer);
    this.isMenuOpen = false;
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

  // Manejar la duplicación de la oferta
  onDuplicate(): void {
    if (this.isDuplicating) return;

    this.confirmationModalService.show(
      {
        title: 'Duplicar Oferta',
        message: '¿Deseas crear una copia de esta oferta de trabajo?',
        confirmText: 'Duplicar',
        cancelText: 'Cancelar'
      },
      () => {
        this.ngZone.run(() => {
          this.duplicateJobOffer();
        });
      }
    );
  }

  // Método para duplicar la oferta de trabajo
  private duplicateJobOffer(): void {
    this.isDuplicating = true;

    // Crear una copia profunda del objeto jobOffer
    const jobOfferCopy: Partial<JobOffer> = { ...this.jobOffer };

    // Eliminar el ID para que se genere uno nuevo
    delete jobOfferCopy.id;

    // Actualizar fechas y metadatos
    const now = new Date();
    jobOfferCopy.createdAt = now;
    jobOfferCopy.updatedAt = now;
    jobOfferCopy.publicationDate = now.toISOString();
    jobOfferCopy.isActive = false; // La oferta duplicada comienza como inactiva

    // Limpiar estadísticas y postulantes
    jobOfferCopy.views = 0;
    jobOfferCopy.applicants = [];

    // Agregar "Copia de" al título si no lo tiene ya
    if (jobOfferCopy.title && !jobOfferCopy.title.startsWith('Copia de ')) {
      jobOfferCopy.title = `Copia de ${jobOfferCopy.title}`;
    }

    // Llamar al servicio para crear la nueva oferta
    this.jobOfferService.createJobOffer(jobOfferCopy as Omit<JobOffer, 'id'>).subscribe({
      next: (newJobId) => {
        this.ngZone.run(() => {
          this.toast.show('Oferta duplicada exitósamente', 'success');
          // Emitir el evento de duplicación con la nueva oferta
          this.duplicated.emit({ ...jobOfferCopy, id: newJobId });
        });
      },
      error: (error) => {
        console.error('Error al duplicar la oferta:', error);
        this.ngZone.run(() => {
          this.toast.show('Error al duplicar la oferta', 'error');
        });
      },
      complete: () => {
        this.ngZone.run(() => {
          this.isDuplicating = false;
        });
      }
    });
  }
}
