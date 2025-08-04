import { CommonModule } from '@angular/common';
import { Component, Input, Output, EventEmitter, inject, NgZone, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { User } from '@angular/fire/auth';
import { JobOfferInfoModalComponent } from './job-offer-menu/job-offer-info-modal/job-offer-info-modal.component';
import { JobOffer } from '../job-offer.model';
import { ConfirmationModalService } from 'src/app/shared/components/confirmation-modal/confirmation-modal.service';
import { ToastService } from 'src/app/shared/components/toast/toast.service';
import { JobOfferActionsService } from '../services/job-offer-actions.service';
import { JobOfferLikeService } from '../services/job-offer-like.service';
import { JobOfferBookmarkService } from '../services/job-offer-bookmark.service';
import { JobOfferShareService } from '../services/job-offer-share.service';
import { JobOfferApplicationService } from '../services/job-offer-application.service';
import { ApplicantsModalComponent } from './applicants-modal/applicants-modal.component';
import { JobOfferFooterComponent } from './job-offer-footer/job-offer-footer.component';
import { JobOfferHeaderComponent } from './job-offer-header/job-offer-header.component';
import { JobOfferBodyComponent } from './job-offer-body/job-offer-body.component';

@Component({
  selector: 'app-job-offer-item',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    JobOfferInfoModalComponent,
    ApplicantsModalComponent,
    JobOfferFooterComponent,
    JobOfferHeaderComponent,
    JobOfferBodyComponent
  ],
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
  @Output() published = new EventEmitter<JobOffer>();
  @Output() cancelled = new EventEmitter<JobOffer>();


  isDuplicating = false;

  // Inyectar servicios necesarios
  private confirmationModalService = inject(ConfirmationModalService);
  private toast = inject(ToastService);
  private ngZone = inject(NgZone);
  private jobOfferActionsService = inject(JobOfferActionsService);
  private jobOfferLikeService = inject(JobOfferLikeService);
  private jobOfferBookmarkService = inject(JobOfferBookmarkService);
  private jobOfferShareService = inject(JobOfferShareService);
  private jobOfferApplicationService = inject(JobOfferApplicationService);

  showInfoModal = false;
  // Estado para controlar la edición de la fecha de vencimiento
  editingDeadline = false;
  newDeadline = '';
  minDate = new Date().toISOString().slice(0, 16);
  showApplicantsModal = false;

  // Estado para mostrar el contador de likes
  likesCount: number = 0;
  private likesSubscription: Subscription | null = null;

  // Estado para mostrar el contador de saves/bookmarks
  bookmarksCount: number = 0;
  private bookmarksSubscription: Subscription | null = null;

  // Estado para mostrar el contador de shares
  sharesCount: number = 0;
  private sharesSubscription: Subscription | null = null;

  // Estado para mostrar el contador de aplicaciones
  applicationsCount: number = 0;
  private applicationsSubscription: Subscription | null = null;

  ngOnInit() {

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

      // Suscribirse a actualizaciones de shares
      this.sharesSubscription = this.jobOfferShareService.getSharesUpdates(
        this.jobOffer.companyId,
        this.jobOffer.id
      ).subscribe({
        next: (count) => {
          this.ngZone.run(() => {
            this.sharesCount = count || 0;
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

  // Limpiar todas las suscripciones al destruir el componente
  ngOnDestroy(): void {
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

    // Limpiar suscripción de bookmarks
    if (this.sharesSubscription) {
      this.sharesSubscription.unsubscribe();
      this.sharesSubscription = null;
    }

    // Limpiar suscripción de aplicaciones
    if (this.applicationsSubscription) {
      this.applicationsSubscription.unsubscribe();
      this.applicationsSubscription = null;
    }
  }



  // Método para manejar el evento mouseleave en la tarjeta
  onMouseLeave(): void {
    // Este método se mantiene para compatibilidad con el template
    // La lógica específica se maneja en el componente de menú
  }

  //==============================
  // Estado para controlar la visibilidad del modal de información
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






  // Método para mostrar el modal de postulados
  onViewApplicants(): void {
    this.showApplicantsModal = true;
  }

  onCloseApplicantsModal() {
    this.showApplicantsModal = false;
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
        if (published) {
          // Actualizar el estado local de la oferta
          const updatedOffer = {
            ...this.jobOffer,
            status: 'publicado',
            publicationDate: new Date().toISOString()
          };
          this.jobOffer = updatedOffer;
          // Emitir el evento de oferta publicada
          this.published.emit(updatedOffer);
        }
      },
      error: (error) => {
        console.error('Error al publicar la oferta:', error);
      }
    });
  }

  // Manejar la cancelación de la oferta
  onCancelPublish(): void {
    this.jobOfferActionsService.confirmCancelPublish(this.jobOffer).subscribe({
      next: (cancelled) => {
        if (cancelled) {
          // Actualizar el estado local de la oferta
          const updatedOffer = {
            ...this.jobOffer,
            status: 'cancelado',
            updatedAt: new Date().toISOString()
          };
          this.jobOffer = updatedOffer;
          // Emitir el evento de oferta cancelada
          this.cancelled.emit(updatedOffer);
        }
      },
      error: (error) => {
        console.error('Error al cancelar la publicación de la oferta:', error);
      }
    });
  }
}
