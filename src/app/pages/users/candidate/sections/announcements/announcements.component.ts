import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PublicJobOfferService } from 'src/app/shared/services/public-job-offer.service';
import { JobOffer } from 'src/app/pages/users/business/sections/business-publication/job-offer.model';

@Component({
  selector: 'app-announcements',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './announcements.component.html',
  styleUrls: ['./announcements.component.css']
})
export class AnnouncementsComponent implements OnInit {
  jobOffers: JobOffer[] = [];
  isLoading = true;
  error: string | null = null;

  constructor(private publicJobOfferService: PublicJobOfferService) {}

  ngOnInit(): void {
    this.loadJobOffers();
  }

  loadJobOffers(): void {
    this.isLoading = true;
    this.error = null;
    
    // Obtener todas las ofertas de trabajo públicas de todas las empresas
    this.publicJobOfferService.getAllPublicJobOffers().subscribe({
      next: (offers) => {
        this.jobOffers = offers;
        this.isLoading = false;
        
        if (offers.length === 0) {
          console.warn('No se encontraron ofertas de trabajo públicas.');
          this.error = 'No hay ofertas de trabajo disponibles en este momento.';
        } else {
        }
      },
      error: (error) => {
        console.error('Error al cargar las ofertas de trabajo:', error);
        this.error = 'Error al cargar las ofertas de trabajo. Por favor, inténtalo de nuevo más tarde.';
        this.isLoading = false;
      },
      complete: () => {
      }
    });
  }

  formatDate(dateString: string): string {
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString('es-ES', options);
  }
}
