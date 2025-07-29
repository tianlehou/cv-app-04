import { Component, OnInit, OnDestroy, Renderer2, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription, interval} from 'rxjs';
import { Auth, User, user } from '@angular/fire/auth';
import { JobOffer } from 'src/app/pages/users/business/sections/business-publication/job-offer.model';
import { PublicJobOfferService } from './services/public-job-offer.service';
import { JobInteractionService } from './services/job-interaction.service';

@Component({
  selector: 'app-announcements',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './announcements.component.html',
  styleUrls: ['./announcements.component.css']
})
export class AnnouncementsComponent implements OnInit, OnDestroy {
  // Límite de caracteres para la vista previa
  private readonly MAX_PREVIEW_LENGTH = 25;

  // Objeto para rastrear el estado de expansión de cada oferta
  expandedStates: { [key: string]: { description: boolean; requirements: boolean } } = {};
  iconStates: { [key: string]: { heart: boolean; bookmark: boolean; share: boolean; cooldown?: boolean } } = {};
  jobOffers: JobOffer[] = [];
  isLoading = true;
  error: string | null = null;

  // Propiedades para el contador de tiempo restante
  timeRemainingStates: { [key: string]: string } = {};
  isTimeCriticalStates: { [key: string]: boolean } = {};
  private countdownSub: Subscription | null = null;
  private timeZone = 'America/Panama';

  private clickListener: (() => void) | null = null;

  private user: User | null = null;
  private userSubscription: Subscription | null = null;

  constructor(
    private publicJobOfferService: PublicJobOfferService,
    private renderer: Renderer2,
    private ngZone: NgZone,
    private auth: Auth,
    private jobInteractionService: JobInteractionService
  ) {
    // Suscribirse a cambios en el estado de autenticación
    this.userSubscription = user(this.auth).subscribe((user) => {
      this.user = user;
    });
  }

  ngOnInit(): void {
    this.loadJobOffers();
  }

  ngOnDestroy(): void {
    if (this.countdownSub) {
      this.countdownSub.unsubscribe();
    }
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
    this.removeOutsideClickListener();
  }

  loadJobOffers(): void {
    this.isLoading = true;
    this.error = null;
    
    // Obtener el email del usuario actual si está autenticado
    const userEmail = this.auth.currentUser?.email || undefined;
    
    this.publicJobOfferService.getAllPublicJobOffers(userEmail).subscribe({
      next: (offers) => {
        this.jobOffers = offers;
        
        // Inicializar los estados de expansión para cada oferta
        this.jobOffers.forEach(offer => {
          if (offer.id) {
            this.expandedStates[offer.id] = { description: false, requirements: false };
          }
        });
        
        // Inicializar el estado de los iconos basado en los likes del usuario
        offers.forEach(offer => {
          if (!this.iconStates[offer.id!]) {
            this.iconStates[offer.id!] = { heart: false, bookmark: false, share: false };
          }
          // Establecer el estado del corazón según si el usuario dio like
          if (offer.userLiked) {
            this.iconStates[offer.id!].heart = true;
          }
        });
        
        this.isLoading = false;
        
        if (offers.length === 0) {
          console.warn('No se encontraron ofertas de trabajo públicas.');
          this.error = 'No hay ofertas de trabajo disponibles en este momento.';
        } else {
          this.initializeTimeRemaining();
        }
      },
      error: (err) => {
        console.error('Error al cargar las ofertas:', err);
        this.error = 'Error al cargar las ofertas de trabajo. Por favor, inténtalo de nuevo más tarde.';
        this.isLoading = false;
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

  // Método para manejar el clic en el corazón
  toggleLike(jobOffer: JobOffer, event: Event): void {
    event.stopPropagation();
    this.jobInteractionService.toggleLike(jobOffer, this.iconStates).subscribe();
  }

  // Método para alternar iconos
  toggleIcon(jobOffer: JobOffer, iconType: 'heart' | 'bookmark' | 'share', event: Event): void {
    event.stopPropagation();
    this.jobInteractionService.toggleIcon(jobOffer, iconType, this.iconStates).subscribe();
  }

  // Método para contraer todas las secciones
  initializeTimeRemaining(): void {
    if (this.countdownSub) {
      this.countdownSub.unsubscribe();
    }
    this.updateAllTimeRemainings();
    this.countdownSub = interval(1000).subscribe(() => {
      this.updateAllTimeRemainings();
    });
  }

  updateAllTimeRemainings(): void {
    this.jobOffers.forEach(offer => {
      if (!offer.id || !offer.deadline) {
        return;
      }

      const now = new Date();
      now.setHours(now.getHours() - 5); // Ajuste de zona horaria
      const deadline = new Date(offer.deadline);

      const nowPanama = new Date(now.toLocaleString('en-US', { timeZone: this.timeZone }));
      const deadlinePanama = new Date(deadline.toLocaleString('en-US', { timeZone: this.timeZone }));

      const diffMs = deadlinePanama.getTime() - nowPanama.getTime();
      const hoursDiff = diffMs / (1000 * 60 * 60);

      this.isTimeCriticalStates[offer.id] = hoursDiff < 24 || diffMs <= 0;

      if (diffMs <= 0) {
        this.timeRemainingStates[offer.id] = 'Expirado';
        return;
      }

      const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

      this.timeRemainingStates[offer.id] = `Tiempo Restante (${days}d ${hours}h ${minutes}m ${seconds}s)`;
    });
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
