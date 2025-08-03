import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PublicationFormComponent } from './publication-form/publication-form.component';
import { CreatePublicationButtonComponent } from './create-publication-button/create-publication-button.component';
import { EmptyPublicationMessageComponent } from './empty-publication-message/empty-publication-message.component';
import { JobOfferItemComponent } from './job-offer-item-container/job-offer-item.component';
import { JobOfferService } from './services/job-offer.service';
import { JobOffer } from './job-offer.model';
import { AuthService } from 'src/app/pages/home/auth/auth.service';
import { Subscription } from 'rxjs';
import { FirebaseService } from 'src/app/shared/services/firebase.service';
import { JobOfferActionsService } from './services/job-offer-actions.service';
import { PublicationFiltersComponent } from './publication-filters/publication-filters.component';

@Component({
  selector: 'app-business-publication',
  standalone: true,
  imports: [
    CommonModule,
    PublicationFormComponent,
    CreatePublicationButtonComponent,
    EmptyPublicationMessageComponent,
    JobOfferItemComponent,
    PublicationFiltersComponent
  ],
  templateUrl: './business-publication.component.html',
  styleUrls: ['./business-publication.component.css']
})
export class BusinessPublicationComponent implements OnInit, OnDestroy {
  private jobOfferService = inject(JobOfferService);
  private authService = inject(AuthService);
  private firebaseService = inject(FirebaseService);
  private jobOfferActionsService = inject(JobOfferActionsService);
  private subscriptions = new Subscription();

  jobOffers: JobOffer[] = [];
  filteredJobOffers: JobOffer[] = [];
  isLoading = true;
  currentUser: any = null;
  showPublicationModal = false;
  hasPublications = false;
  isEditing = false;
  currentJobOffer: JobOffer | null = null;
  lastDuplicatedId: string | null = null;

  statusCounts = {
    all: 0,
    published: 0,
    draft: 0,
    expired: 0,
    cancelled: 0
  };

  constructor() {
    this.currentUser = this.authService.getCurrentAuthUser();
  }

  ngOnInit(): void {
    this.loadJobOffers();
    this.setupOfferDuplicatedListener();
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

  private loadJobOffers(): void {
    this.isLoading = true;
    const userEmailKey = this.firebaseService.formatEmailKey(this.currentUser.email);

    this.subscriptions.add(
      this.jobOfferService.getJobOffersByCompany(userEmailKey, 'all').subscribe({
        next: (allOffers: JobOffer[]) => {
          this.jobOffers = allOffers;
          this.calculateStatusCounts(allOffers);
          this.hasPublications = allOffers.length > 0;
          this.isLoading = false;
          this.onFilteredOffers(allOffers);
        },
        error: (error: any) => {
          console.error('Error al cargar las ofertas:', error);
          this.isLoading = false;
        }
      })
    );
  }

  onPublicationSaved(): void {
    this.togglePublicationModal(false);
    this.loadJobOffers();
  }

  private calculateStatusCounts(offers: JobOffer[]): void {
    this.statusCounts = {
      all: offers.length,
      published: offers.filter(offer => offer.status === 'publicado').length,
      draft: offers.filter(offer => offer.status === 'borrador').length,
      expired: offers.filter(offer => offer.status === 'vencido').length,
      cancelled: offers.filter(offer => offer.status === 'cancelado').length
    };
  }

  onFilteredOffers(filteredOffers: JobOffer[]): void {
    this.filteredJobOffers = filteredOffers;
    this.hasPublications = filteredOffers.length > 0;
  }

  onJobOfferDeleted(jobId: string): void {
    this.subscriptions.add(
      this.jobOfferService.deleteJobOffer(jobId).subscribe({
        next: () => {
          this.jobOffers = this.jobOffers.filter(offer => offer.id !== jobId);
          this.filteredJobOffers = this.filteredJobOffers.filter(offer => offer.id !== jobId);
          this.hasPublications = this.filteredJobOffers.length > 0;
          this.calculateStatusCounts(this.jobOffers);
        },
        error: (error) => {
          console.error('Error al eliminar la oferta:', error);
        }
      })
    );
  }

  onJobOfferPublished(updatedOffer: JobOffer): void {
    // Actualizar la oferta en el array jobOffers
    const index = this.jobOffers.findIndex(offer => offer.id === updatedOffer.id);
    if (index !== -1) {
      this.jobOffers[index] = { ...updatedOffer };
    } else {
      this.jobOffers = [updatedOffer, ...this.jobOffers];
    }
    
    // Actualizar filteredJobOffers si es necesario
    const filteredIndex = this.filteredJobOffers.findIndex(offer => offer.id === updatedOffer.id);
    if (filteredIndex !== -1) {
      this.filteredJobOffers[filteredIndex] = { ...updatedOffer };
    } else if (this.shouldShowInCurrentFilter(updatedOffer)) {
      this.filteredJobOffers = [updatedOffer, ...this.filteredJobOffers];
    }
    
    // Recalcular los contadores de estado
    this.calculateStatusCounts(this.jobOffers);
  }

  onJobOfferCancelled(updatedOffer: JobOffer): void {
    // Actualizar la oferta en el array jobOffers
    const index = this.jobOffers.findIndex(offer => offer.id === updatedOffer.id);
    if (index !== -1) {
      this.jobOffers[index] = { ...updatedOffer };
    }
    
    // Actualizar filteredJobOffers si es necesario
    const filteredIndex = this.filteredJobOffers.findIndex(offer => offer.id === updatedOffer.id);
    if (filteredIndex !== -1) {
      this.filteredJobOffers[filteredIndex] = { ...updatedOffer };
      // Si el filtro actual no incluye ofertas canceladas, quitarla del filtro
      if (!this.shouldShowInCurrentFilter(updatedOffer)) {
        this.filteredJobOffers = this.filteredJobOffers.filter(offer => offer.id !== updatedOffer.id);
      }
    } else if (this.shouldShowInCurrentFilter(updatedOffer)) {
      this.filteredJobOffers = [updatedOffer, ...this.filteredJobOffers];
    }
    
    // Recalcular los contadores de estado
    this.calculateStatusCounts(this.jobOffers);
  }
  
  private shouldShowInCurrentFilter(offer: JobOffer): boolean {
    // Aquí deberías implementar la lógica para determinar si la oferta debe mostrarse
    // según el filtro actual. Por ahora, asumimos que siempre se muestra.
    return true;
  }

  onJobOfferDuplicated(newJobOffer: JobOffer): void {
    if (newJobOffer.id) {
      this.lastDuplicatedId = newJobOffer.id;
      this.jobOffers = [newJobOffer, ...this.jobOffers];
      this.filteredJobOffers = [newJobOffer, ...this.filteredJobOffers];
      this.hasPublications = this.filteredJobOffers.length > 0;
      this.calculateStatusCounts(this.jobOffers);

      setTimeout(() => {
        this.lastDuplicatedId = null;
      }, 3000);
    }
  }

  private setupOfferDuplicatedListener(): void {
    this.subscriptions.add(
      this.jobOfferActionsService.offerDuplicated$.subscribe((newOffer: JobOffer) => {
        const offerWithAnimation = { ...newOffer, isNew: true };
        this.jobOffers = [offerWithAnimation, ...this.jobOffers];
        this.filteredJobOffers = [offerWithAnimation, ...this.filteredJobOffers];
        this.hasPublications = this.filteredJobOffers.length > 0;
        this.calculateStatusCounts(this.jobOffers);

        setTimeout(() => {
          const fullIndex = this.jobOffers.findIndex(offer => offer.id === newOffer.id);
          if (fullIndex !== -1) {
            this.jobOffers[fullIndex] = { ...this.jobOffers[fullIndex], isNew: false };
            this.jobOffers = [...this.jobOffers];
          }
          
          const filteredIndex = this.filteredJobOffers.findIndex(offer => offer.id === newOffer.id);
          if (filteredIndex !== -1) {
            this.filteredJobOffers[filteredIndex] = { ...this.filteredJobOffers[filteredIndex], isNew: false };
            this.filteredJobOffers = [...this.filteredJobOffers];
          }
        }, 1000);
      })
    );
  }
}