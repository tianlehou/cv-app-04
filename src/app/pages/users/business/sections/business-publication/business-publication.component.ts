import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PublicationFormComponent } from './publication-form/publication-form.component';
import { CreatePublicationButtonComponent } from './create-publication-button/create-publication-button.component';
import { EmptyPublicationMessageComponent } from './empty-publication-message/empty-publication-message.component';
import { JobOfferItemComponent } from './job-offer-item-container/job-offer-item.component';
import { JobOfferService } from './job-offer.service';
import { JobOffer } from './job-offer.model';
import { AuthService } from 'src/app/pages/home/auth/auth.service';
import { Subscription } from 'rxjs';
import { FirebaseService } from 'src/app/shared/services/firebase.service';

@Component({
  selector: 'app-business-publication',
  standalone: true,
  imports: [
    CommonModule,
    PublicationFormComponent,
    CreatePublicationButtonComponent,
    EmptyPublicationMessageComponent,
    JobOfferItemComponent
  ],
  templateUrl: './business-publication.component.html',
  styleUrls: ['./business-publication.component.css']
})
export class BusinessPublicationComponent implements OnInit, OnDestroy {
  private jobOfferService = inject(JobOfferService);
  private authService = inject(AuthService);
    private firebaseService = inject(FirebaseService);
  private subscriptions = new Subscription();

  jobOffers: JobOffer[] = [];
  isLoading = true;
  currentUser: any = null;
  showPublicationModal = false;
  hasPublications = false;
  isEditing = false;
  currentJobOffer: JobOffer | null = null;
  lastDuplicatedId: string | null = null; // Para rastrear la última oferta duplicada

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentAuthUser();
    this.loadJobOffers();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  togglePublicationModal(show: boolean, jobOffer: JobOffer | null = null): void {
    this.showPublicationModal = show;
    this.isEditing = !!jobOffer;
    this.currentJobOffer = jobOffer;
  }

  onFormSubmitted(): void {
    this.togglePublicationModal(false);
  }

  // Cargar las ofertas de trabajo del usuario actual
  private loadJobOffers(): void {
    this.isLoading = true;
    const userEmailKey = this.firebaseService.formatEmailKey(this.currentUser.email);

    this.subscriptions.add(
      this.jobOfferService.getJobOffersByCompany(userEmailKey).subscribe({
        next: (offers: JobOffer[]) => {
          // Ordenar las ofertas según el estado: borrador, publicado, cancelado, vencido
          this.jobOffers = offers.sort((a, b) => {
            // Definir el orden de los estados
            const statusOrder: {[key: string]: number} = {
              'borrador': 0,
              'publicado': 1,
              'cancelado': 2,
              'vencido': 3
            };
            
            // Comparar los estados según el orden definido
            const orderA = statusOrder[a.status] ?? 4; // Si el estado no está en la lista, va al final
            const orderB = statusOrder[b.status] ?? 4;
            
            // Si los estados son iguales, ordenar según el tipo de estado
            if (orderA === orderB) {
              let dateA: number;
              let dateB: number;
              
              // Determinar qué fecha usar según el estado
              if (a.status === 'borrador') {
                // Para borradores, usar fecha de creación
                dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
              } else if (a.status === 'publicado' || a.status === 'vencido') {
                // Para publicados o vencidos, usar fecha de vencimiento
                dateA = a.deadline ? new Date(a.deadline).getTime() : 0;
                dateB = b.deadline ? new Date(b.deadline).getTime() : 0;
              } else if (a.status === 'cancelado') {
                // Para cancelados, usar fecha de actualización (que sería cuando se canceló)
                dateA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
                dateB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
              } else {
                // Para cualquier otro estado, usar la fecha de creación por defecto
                dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
              }
              
              return dateB - dateA; // Orden descendente (más reciente primero)
            }
            
            return orderA - orderB; // Ordenar según el orden de estados definido
          });
          
          this.hasPublications = offers.length > 0;
          this.isLoading = false;
        },
        error: (error: any) => {
          console.error('Error al cargar las ofertas:', error);
          this.isLoading = false;
        }
      })
    );
  }

  // Se llama cuando se guarda exitosamente una publicación
  onPublicationSaved(): void {
    this.togglePublicationModal(false);
    this.loadJobOffers(); // Recargar la lista de ofertas
  }

  // Manejar la eliminación de una oferta
  onJobOfferDeleted(jobId: string): void {
    this.subscriptions.add(
      this.jobOfferService.deleteJobOffer(jobId).subscribe({
        next: () => {
          // Filtrar la oferta eliminada de la lista
          this.jobOffers = this.jobOffers.filter(offer => offer.id !== jobId);
          this.hasPublications = this.jobOffers.length > 0;
        },
        error: (error) => {
          console.error('Error al eliminar la oferta:', error);
        }
      })
    );
  }

  // Manejar la duplicación de una oferta
  onJobOfferDuplicated(newJobOffer: JobOffer): void {
    // Establecer el ID de la oferta recién duplicada para la animación
    if (newJobOffer.id) {
      this.lastDuplicatedId = newJobOffer.id;
      
      // Agregar la nueva oferta al principio de la lista
      this.jobOffers = [newJobOffer, ...this.jobOffers];
      this.hasPublications = true;
      
      // Remover la clase de animación después de que termine
      setTimeout(() => {
        this.lastDuplicatedId = null;
      }, 3000); // Duración de la animación en ms
    }
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

  // Obtener el texto de la modalidad
  getModalityLabel(modality: string): string {
    const modalities: { [key: string]: string } = {
      'presencial': 'Presencial',
      'remoto': 'Remoto',
      'hibrido': 'Híbrido'
    };
    return modalities[modality] || modality;
  }

  // Formatear la fecha
  formatDate(dateString: string): string {
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    };
    return new Date(dateString).toLocaleDateString('es-ES', options);
  }

  // Formatear el salario
  formatSalary(salary: number): string {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(salary);
  }
}
