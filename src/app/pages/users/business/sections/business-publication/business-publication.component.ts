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
  private subscriptions = new Subscription();
  
  jobOffers: JobOffer[] = [];
  isLoading = true;
  currentUser: any = null;
  showPublicationModal = false;
  hasPublications = false;

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentAuthUser();
    this.loadJobOffers();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  togglePublicationModal(show: boolean): void {
    this.showPublicationModal = show;
  }

  onFormSubmitted(): void {
    this.togglePublicationModal(false);
  }

  // Cargar las ofertas de trabajo del usuario actual
  private loadJobOffers(): void {
    this.isLoading = true;
    this.subscriptions.add(
      this.jobOfferService.getJobOffersByCompany(this.currentUser.uid).subscribe({
        next: (offers) => {
          this.jobOffers = offers;
          this.hasPublications = offers.length > 0;
          this.isLoading = false;
        },
        error: (error) => {
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
