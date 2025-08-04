import { inject, Injectable, NgZone } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { JobOfferService } from './job-offer.service';
import { ConfirmationModalService } from 'src/app/shared/components/confirmation-modal/confirmation-modal.service';
import { ToastService } from 'src/app/shared/components/toast/toast.service';

@Injectable({
  providedIn: 'root'
})
export class JobOfferActionsService {
  // Evento que se emite cuando se duplica una oferta exitosamente
  private offerDuplicated = new Subject<any>();
  offerDuplicated$ = this.offerDuplicated.asObservable();
  
  private ngZone = inject(NgZone);

  constructor(
    private jobOfferService: JobOfferService,
    private confirmationModalService: ConfirmationModalService,
    private toast: ToastService
  ) {}

  isDeadlineValid(deadline: string): { isValid: boolean; title: string; message: string } {
    if (!deadline) {
      return {
        isValid: false,
        title: 'Fecha de vencimiento requerida',
        message: 'Debes establecer una fecha de vencimiento para publicar la oferta.'
      };
    }

    const now = new Date();
    const deadlineDate = new Date(deadline);
    const diffMs = deadlineDate.getTime() - now.getTime();
    const hoursDiff = diffMs / (1000 * 60 * 60);

    if (diffMs <= 0) {
      return {
        isValid: false,
        title: 'Fecha de vencimiento inválida',
        message: 'La fecha de vencimiento debe ser una fecha futura.'
      };
    }

    if (hoursDiff < 24) {
      return {
        isValid: false,
        title: 'Tiempo mínimo insuficiente',
        message: 'La oferta debe tener al menos 24 horas de vigencia desde el momento de su publicación.'
      };
    }

    return { isValid: true, title: '', message: '' };
  }

  confirmDuplicate(jobOffer: any): Observable<boolean> {
    return new Observable(subscriber => {
      this.confirmationModalService.show(
        {
          title: '¿Duplicar oferta?',
          message: '¿Estás seguro de que deseas duplicar esta oferta de trabajo?',
          confirmText: 'Duplicar',
          cancelText: 'Cancelar'
        },
        () => {
          // Crear una copia profunda del objeto jobOffer
          const jobOfferCopy: any = JSON.parse(JSON.stringify(jobOffer));

          // Eliminar el ID para que se genere uno nuevo
          delete jobOfferCopy.id;

          // Eliminar la fecha de publicación para que no se copie al duplicar
          delete jobOfferCopy.publicationDate;

          // Asegurarse de que los campos requeridos estén presentes
          const now = new Date();
          jobOfferCopy.createdAt = now;
          jobOfferCopy.updatedAt = now;
          jobOfferCopy.status = 'borrador'; // La oferta duplicada comienza como borrador

          // Limpiar estadísticas, postulantes y arrays de seguimiento
          jobOfferCopy.likes = 0;
          jobOfferCopy.saves = 0;
          jobOfferCopy.applications = 0;
          
          // Limpiar arrays de seguimiento de usuarios
          jobOfferCopy.appliedBy = [];
          jobOfferCopy.likedBy = [];
          jobOfferCopy.savedBy = [];

          // Llamar al servicio para crear la nueva oferta
          this.jobOfferService.createJobOffer(jobOfferCopy).subscribe({
            next: (newJobId) => {
              this.ngZone.run(() => {
                this.toast.show('Oferta duplicada exitosamente', 'success');
                // Emitir el evento con la nueva oferta
                this.offerDuplicated.next({ ...jobOfferCopy, id: newJobId });
                // Notificar al suscriptor que la duplicación fue exitosa
                subscriber.next(true);
                subscriber.complete();
              });
            },
            error: (error) => {
              console.error('Error al duplicar la oferta:', error);
              this.ngZone.run(() => {
                this.toast.show('Error al duplicar la oferta', 'error');
                subscriber.error(error);
              });
            }
          });
        },
        () => {
          // El usuario canceló la duplicación
          subscriber.next(false);
          subscriber.complete();
        }
      );
    });
  }

  confirmPublish(jobOffer: any): Observable<boolean> {
    return new Observable(subscriber => {
      // Verificar si ya está publicada
      if (jobOffer.status === 'publicado') {
        this.toast.show('Esta oferta ya está publicada', 'info');
        subscriber.next(false);
        subscriber.complete();
        return;
      }

      // Verificar si la fecha de vencimiento es válida
      const deadlineValidation = this.isDeadlineValid(jobOffer.deadline);
      if (!deadlineValidation.isValid) {
        this.confirmationModalService.show(
          {
            title: deadlineValidation.title,
            message: deadlineValidation.message,
            confirmText: '',
            cancelText: 'Entendido'
          },
          () => {
            subscriber.next(false);
            subscriber.complete();
          },
          () => {
            subscriber.next(false);
            subscriber.complete();
          }
        );
        return;
      }

      // Mostrar diálogo de confirmación
      this.confirmationModalService.show(
        {
          title: 'Publicar oferta',
          message: '¿Estás seguro de que deseas publicar esta oferta de trabajo? Una vez publicada, no podrá ser editada.',
          confirmText: 'Publicar',
          cancelText: 'Cancelar'
        },
        () => {
          // Confirmar publicación
          this.jobOfferService.publishJobOffer(jobOffer.id).subscribe({
            next: () => {
              this.toast.show('Oferta publicada exitosamente', 'success');
              // Actualizar el estado de la oferta
              jobOffer.status = 'publicado';
              jobOffer.publicationDate = new Date().toISOString();
              subscriber.next(true);
              subscriber.complete();
            },
            error: (error: Error) => {
              console.error('Error al publicar oferta:', error);
              this.toast.show(error.message || 'Error al publicar la oferta', 'error');
              subscriber.error(error);
            }
          });
        },
        () => {
          // Cancelar publicación
          subscriber.next(false);
          subscriber.complete();
        }
      );
    });
  }

  confirmCancelPublish(jobOffer: any): Observable<boolean> {
    return new Observable(subscriber => {
      // Verificar si está publicada
      if (jobOffer.status !== 'publicado') {
        this.toast.show('Solo se pueden cancelar ofertas publicadas', 'info');
        subscriber.next(false);
        subscriber.complete();
        return;
      }

      // Mostrar diálogo de confirmación
      this.confirmationModalService.show(
        {
          title: 'Cancelar publicación',
          message: '¿Estás seguro de que deseas cancelar la publicación de esta oferta de trabajo?',
          confirmText: 'Sí, cancelar',
          cancelText: 'No, mantener publicada'
        },
        () => {
          // Confirmar cancelación
          this.jobOfferService.cancelJobOffer(jobOffer.id).subscribe({
            next: () => {
              this.toast.show('Publicación cancelada exitosamente', 'success');
              // Actualizar el estado de la oferta
              jobOffer.status = 'cancelado';
              jobOffer.updatedAt = new Date().toISOString();
              subscriber.next(true);
              subscriber.complete();
            },
            error: (error: Error) => {
              console.error('Error al cancelar publicación de oferta:', error);
              this.toast.show(error.message || 'Error al cancelar la publicación', 'error');
              subscriber.error(error);
            }
          });
        },
        () => {
          // Cancelar acción
          subscriber.next(false);
          subscriber.complete();
        }
      );
    });
  }
}
