import { CommonModule } from '@angular/common';
import { Component, Input, Output, EventEmitter, inject, NgZone, OnDestroy, OnInit } from '@angular/core';
import { interval, Subscription } from 'rxjs';
import { JobOfferInfoModalComponent } from './job-offer-info-modal/job-offer-info-modal.component';
import { User } from '@angular/fire/auth';
import { ConfirmationModalService } from 'src/app/shared/components/confirmation-modal/confirmation-modal.service';
import { ToastService } from 'src/app/shared/components/toast/toast.service';
import { JobOfferActionsService } from '../services/job-offer-actions.service';
import { JobOfferLikeService } from '../services/job-offer-like.service';
import { JobOfferBookmarkService } from '../services/job-offer-bookmark.service';
import { JobOfferApplicationService } from '../services/job-offer-application.service';
import { getFullText, getPreviewText, isTextLong } from 'src/app/shared/utils/text.utils';
import { JobOfferMenuComponent } from './job-offer-menu/job-offer-menu.component';

@Component({
  selector: 'app-job-offer-item',
  standalone: true,
  imports: [CommonModule, JobOfferInfoModalComponent, JobOfferMenuComponent],
  templateUrl: './job-offer-item.component.html',
  styleUrls: ['./job-offer-item.component.css']
})
export class JobOfferItemComponent implements OnInit, OnDestroy {
  @Input() jobOffer: any;
  @Input() currentUser: User | null = null;
  @Input() isOwner: boolean = false;
  @Output() duplicated = new EventEmitter<any>();
  @Output() edit = new EventEmitter<any>();
  @Output() deleted = new EventEmitter<string>();


  isDuplicating = false;

  // Inyectar servicios necesarios
  private confirmationModalService = inject(ConfirmationModalService);
  private toast = inject(ToastService);
  private ngZone = inject(NgZone);
  private jobOfferActionsService = inject(JobOfferActionsService);
  private jobOfferLikeService = inject(JobOfferLikeService);
  private jobOfferBookmarkService = inject(JobOfferBookmarkService);
  private jobOfferApplicationService = inject(JobOfferApplicationService);



  // Estado para controlar la expansión de texto
  showFullDescription = false;
  showFullRequirements = false;

  public getFullText = getFullText;
  public getPreviewText = getPreviewText;
  public isTextLong = isTextLong;

  // Estado para mostrar el contador de likes
  likesCount: number = 0;
  private likesSubscription: Subscription | null = null;

  // Estado para mostrar el contador de saves/bookmarks
  bookmarksCount: number = 0;
  private bookmarksSubscription: Subscription | null = null;

  // Estado para mostrar el contador de aplicaciones
  applicationsCount: number = 0;
  private applicationsSubscription: Subscription | null = null;

  ngOnInit() {
    this.updateTimeRemaining();
    // Actualizar cada segundo
    this.countdownSub = interval(1000).subscribe(() => {
      this.updateTimeRemaining();
    });

    // Suscribirse a actualizaciones de likes
    if (this.jobOffer?.id && this.jobOffer?.companyId) {
      this.likesSubscription = this.jobOfferLikeService.getLikesUpdates(
        this.jobOffer.companyId,
        this.jobOffer.id
      ).subscribe({
        next: (count) => {
          this.ngZone.run(() => {
            this.likesCount = count || 0;
          });
        },
        error: (error) => {
          console.error('Error al obtener actualizaciones de likes:', error);
        }
      });

      // Suscribirse a actualizaciones de bookmarks
      this.bookmarksSubscription = this.jobOfferBookmarkService.getSavesUpdates(
        this.jobOffer.companyId,
        this.jobOffer.id
      ).subscribe({
        next: (count) => {
          this.ngZone.run(() => {
            this.bookmarksCount = count || 0;
          });
        },
        error: (error) => {
          console.error('Error al obtener actualizaciones de bookmarks:', error);
        }
      });

      // Suscribirse a cambios en las aplicaciones
      this.applicationsSubscription = this.jobOfferApplicationService.getApplicationsUpdates(
        this.jobOffer.companyId,
        this.jobOffer.id
      ).subscribe({
        next: (count) => {
          this.ngZone.run(() => {
            this.applicationsCount = count || 0;
          });
        },
        error: (error) => {
          console.error('Error al obtener actualizaciones de aplicaciones:', error);
        }
      });
    }
  }

  // Limpiar todas las suscripciones y listeners al destruir el componente
  ngOnDestroy(): void {
    // Limpiar suscripción del contador regresivo
    if (this.countdownSub) {
      this.countdownSub.unsubscribe();
      this.countdownSub = null;
    }

    // Limpiar suscripción de likes
    if (this.likesSubscription) {
      this.likesSubscription.unsubscribe();
      this.likesSubscription = null;
    }

    // Limpiar suscripción de bookmarks
    if (this.bookmarksSubscription) {
      this.bookmarksSubscription.unsubscribe();
      this.bookmarksSubscription = null;
    }

    // Limpiar suscripción de aplicaciones
    if (this.applicationsSubscription) {
      this.applicationsSubscription.unsubscribe();
      this.applicationsSubscription = null;
    }

    // Limpiar listeners de clic
    this.removeOutsideClickListener();

    // Limpiar cualquier referencia a callbacks para prevenir memory leaks
    // this.menuClickListener se eliminó ya que la lógica del menú está en el componente hijo
  }

  // Propiedad para el listener de clic
  private clickListener: (() => void) | null = null;

  // Contador regresivo
  private countdownSub: Subscription | null = null;
  timeRemaining: string = '';
  isTimeCritical: boolean = false; // Indica si faltan menos de 24 horas o está expirado
  private timeZone = 'America/Panama';

  private updateTimeRemaining() {
    if (!this.jobOffer?.deadline) {
      this.timeRemaining = '';
      this.isTimeCritical = false;
      return;
    }

    const now = new Date();
    // Ajustar 5 horas a la fecha actual
    now.setHours(now.getHours() - 5);

    const deadline = new Date(this.jobOffer.deadline);

    // Asegurarse de que estamos comparando en la misma zona horaria
    const nowPanama = new Date(now.toLocaleString('en-US', { timeZone: this.timeZone }));
    const deadlinePanama = new Date(deadline.toLocaleString('en-US', { timeZone: this.timeZone }));

    const diffMs = deadlinePanama.getTime() - nowPanama.getTime();
    const hoursDiff = diffMs / (1000 * 60 * 60); // Convertir a horas

    // Verificar si faltan menos de 24 horas o si ya expiró
    this.isTimeCritical = hoursDiff < 24 || diffMs <= 0;

    if (diffMs <= 0) {
      this.timeRemaining = 'Expirado';
      return;
    }

    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

    this.timeRemaining = `Tiempo Restante (${days}d ${hours}h ${minutes}m ${seconds}s)`;
  }

  // Método para cerrar el menú al salir del área del menú
  onMouseLeave(): void {
    // Esta función se mantiene por compatibilidad
  }

  //==============================
  // Estado para controlar la visibilidad del modal de información
  showInfoModal = false;

  // Abrir el modal de información
  openInfoModal(): void {
    this.showInfoModal = true;
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

  // Método para manejar cuando el mouse sale del componente
  // Se mantiene por compatibilidad pero ya no hace nada ya que el menú está en un componente separado

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

  // Remover listener de clic fuera del componente
  private removeOutsideClickListener(): void {
    if (this.clickListener) {
      document.removeEventListener('click', this.clickListener);
      this.clickListener = null;
    }
  }

  // Formatear la fecha para mostrarla de manera legible
  formatDate(dateString: string | undefined | null): string {
    if (!dateString) return 'No especificada';

    try {
      // Intentar formatear con el locale 'es' (que registramos en main.ts)
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
      // Si hay un error, devolver la fecha en formato ISO o el string original
      try {
        return new Date(dateString).toISOString().split('T')[0];
      } catch (e) {
        return dateString;
      }
    }
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
      'completa': 'Turno completo',
      'parcial': 'Medio turno',
      'por-horas': 'Por Horas'
    };
    return workdays[workday] || workday;
  }

  // Manejar la duplicación de la oferta
  onDuplicate(): void {
    this.jobOfferActionsService.confirmDuplicate(this.jobOffer).subscribe({
      next: (duplicated) => {
        // La lógica del menú ahora está en el componente hijo
      },
      error: () => {
        // Manejo de error
      }
    });
  }

  // Manejar clic en editar
  // Este método emite el evento de edición con la oferta de trabajo
  onEdit(): void {
    this.edit.emit(this.jobOffer);
    // La lógica del menú ahora está en el componente hijo
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

  // Manejar la publicación de la oferta
  onPublish(): void {
    this.jobOfferActionsService.confirmPublish(this.jobOffer).subscribe({
      next: (published) => {
        // La lógica del menú ahora está en el componente hijo
      },
      error: () => {
        // Manejo de error
      }
    });
  }

  // Manejar la cancelación de la oferta
  onCancelPublish(): void {
    this.jobOfferActionsService.confirmCancelPublish(this.jobOffer).subscribe({
      next: (cancelled) => {
        // La lógica del menú ahora está en el componente hijo
      },
      error: () => {
        // Manejo de error
      }
    });
  }
}
