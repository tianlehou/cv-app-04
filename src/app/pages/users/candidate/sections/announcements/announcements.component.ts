import { Component, OnInit, Renderer2, NgZone } from '@angular/core';
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
  // Límite de caracteres para la vista previa
  private readonly MAX_PREVIEW_LENGTH = 25;

  // Objeto para rastrear el estado de expansión de cada oferta
  expandedStates: { [key: string]: { description: boolean; requirements: boolean } } = {};
  jobOffers: JobOffer[] = [];
  isLoading = true;
  error: string | null = null;

  private clickListener: (() => void) | null = null;

  constructor(
    private publicJobOfferService: PublicJobOfferService,
    private renderer: Renderer2,
    private ngZone: NgZone
  ) {}

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
        // Inicializar los estados de expansión para cada oferta
        this.jobOffers.forEach(offer => {
          if (offer.id) {
            this.expandedStates[offer.id] = { description: false, requirements: false };
          }
        });
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

  // Obtener texto recortado para vista previa
  getPreviewText(text: string | undefined): string {
    if (!text) return '';
    return text.length > this.MAX_PREVIEW_LENGTH
      ? text.slice(0, this.MAX_PREVIEW_LENGTH) + '...'
      : text;
  }

  // Obtener texto completo
  getFullText(text: string | undefined): string {
    if (!text) return '';
    return text;
  }

  // Ver si el texto es más largo que el límite de vista previa
  isTextLong(text: string | undefined): boolean {
    if (!text) return false;
    return text.length > this.MAX_PREVIEW_LENGTH;
  }

  // Manejar clic en ver más/menos
  toggleShowMore(jobOfferId: string | undefined, section: 'description' | 'requirements', event: MouseEvent): void {
    event.stopPropagation(); // Detener la propagación para que no se cierre inmediatamente

    if (!jobOfferId) return;

    const currentState = this.expandedStates[jobOfferId][section];
    // Primero, contraer todas las secciones para un comportamiento de acordeón
    this.collapseAllSections();
    // Luego, expandir la sección actual si estaba contraída
    this.expandedStates[jobOfferId][section] = !currentState;

    // Si se abre una sección, configurar el listener. Si se cierra, removerlo.
    if (this.expandedStates[jobOfferId][section]) {
      this.setupOutsideClickListener(event.currentTarget as HTMLElement);
    } else {
      this.removeOutsideClickListener();
    }
  }

  // Configurar listener para cerrar al hacer clic fuera
  setupOutsideClickListener(cardElement: HTMLElement): void {
    this.removeOutsideClickListener(); // Asegurarse de que no haya listeners previos

    this.ngZone.runOutsideAngular(() => {
      this.clickListener = this.renderer.listen('document', 'click', (event: MouseEvent) => {
        // Si el clic fue fuera de la tarjeta actual, contraer todo
        if (!cardElement.contains(event.target as Node)) {
          this.ngZone.run(() => {
            this.collapseAllSections();
            this.removeOutsideClickListener();
          });
        }
      });
    });
  }

  // Remover listener
  removeOutsideClickListener(): void {
    if (this.clickListener) {
      this.clickListener();
      this.clickListener = null;
    }
  }

  // Método para contraer todas las secciones
  collapseAllSections(): void {
    for (const key in this.expandedStates) {
      if (Object.prototype.hasOwnProperty.call(this.expandedStates, key)) {
        this.expandedStates[key].description = false;
        this.expandedStates[key].requirements = false;
      }
    }
  }
}
