import { Component, OnInit, OnDestroy, Renderer2, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription, interval } from 'rxjs';
import { Auth, User, user } from '@angular/fire/auth';
import { JobOffer } from 'src/app/pages/users/business/sections/business-publication/job-offer.model';
import { PublicJobOfferService } from './services/public-job-offer.service';
import { JobInteractionService } from './services/job-interaction.service';
import { ConfirmationModalService } from 'src/app/shared/components/confirmation-modal/confirmation-modal.service';
import { getFullText, getPreviewText, isTextLong } from 'src/app/shared/utils/text.utils'

@Component({
  selector: 'app-announcements',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './announcements.component.html',
  styleUrls: ['./announcements.component.css']
})
export class AnnouncementsComponent implements OnInit, OnDestroy {
  // Objeto para rastrear el estado de expansión de cada oferta
  expandedStates: { [key: string]: { description: boolean; requirements: boolean } } = {};
  iconStates: { [key: string]: { heart: boolean; bookmark: boolean; share: boolean; cooldown?: boolean } } = {};
  isApplying: { [key: string]: boolean } = {};
  jobOffers: JobOffer[] = [];
  isLoading = true;
  error: string | null = null;

  // Propiedades para el contador de tiempo restante
  timeRemainingStates: { [key: string]: string } = {};
  isTimeCriticalStates: { [key: string]: boolean } = {};
  private countdownSub: Subscription | null = null;
  private timeZone = 'America/Panama';

  private clickListener: (() => void) | null = null;

  user: User | null = null;
  private userSubscription: Subscription | null = null;

  public getFullText = getFullText;
  public getPreviewText = getPreviewText;
  public isTextLong = isTextLong;

  constructor(
    private publicJobOfferService: PublicJobOfferService,
    private jobInteractionService: JobInteractionService,
    private confirmationModalService: ConfirmationModalService,
    private auth: Auth,
    private renderer: Renderer2,
    private ngZone: NgZone
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

      this.timeRemainingStates[offer.id] = `Termina en: (${days}d ${hours}h ${minutes}m ${seconds}s)`;
    });
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

        // Inicializar el estado de los iconos basado en los likes, bookmarks y aplicaciones del usuario
        offers.forEach(offer => {
          if (!this.iconStates[offer.id!]) {
            this.iconStates[offer.id!] = { heart: false, bookmark: false, share: false };
          }
          // Establecer el estado del corazón según si el usuario dio like
          if (offer.userLiked) {
            this.iconStates[offer.id!].heart = true;
          }
          // Establecer el estado del bookmark según si el usuario lo guardó
          if (offer.userSaved) {
            this.iconStates[offer.id!].bookmark = true;
          }
          // Verificar si el usuario ya aplicó a esta oferta
          if (offer.appliedBy) {
            offer.hasApplied = true;
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
      year: '2-digit',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString('es-ES', options);
  }

  // Función para trackear ofertas por un identificador único
  trackByOfferId(index: number, jobOffer: JobOffer): string {
    // Usar una combinación de companyName y id para asegurar unicidad
    // Si no hay companyName, usamos el índice como respaldo
    return jobOffer.companyName ? `${jobOffer.companyName}_${jobOffer.id}` : `offer_${index}`;
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

  // Método para manejar el clic en el ícono de compartir
  async shareJobOffer(jobOffer: JobOffer, event: Event): Promise<void> {
    event.stopPropagation();
    
    // Si ya está en cooldown, no hacer nada
    if (this.iconStates[jobOffer.id!]?.cooldown) return;
    
    try {
      // Activar estado de cooldown
      this.iconStates[jobOffer.id!] = { ...this.iconStates[jobOffer.id!], cooldown: true };
      
      // Crear el texto para compartir
      const shareData = {
        title: `Oferta de Trabajo: ${jobOffer.title}`,
        text: `Mira esta oferta de trabajo: ${jobOffer.title}\n\n${jobOffer.description?.substring(0, 100)}...`,
        url: window.location.href
      };

      // Verificar si el navegador soporta la Web Share API
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        // Fallback para navegadores que no soportan Web Share API
        await navigator.clipboard.writeText(`${shareData.title}\n\n${shareData.text}\n\n${shareData.url}`);
        alert('¡Enlace copiado al portapapeles!');
      }

      // Actualizar el contador de compartidos en la base de datos
      if (this.user?.email && jobOffer.id && jobOffer.companyId) {
        this.jobInteractionService.updateJobOfferShares(
          jobOffer.id,
          jobOffer.companyId,
          this.user.email
        ).subscribe({
          next: (response) => {
            if (response.success) {
              // Actualizar el contador localmente si es necesario
              if (jobOffer.id) {
                jobOffer.shares = (jobOffer.shares || 0) + 1;
              }
            }
          },
          error: (error) => {
            console.error('Error al actualizar el contador de compartidos:', error);
          }
        });
      }
    } catch (err) {
      console.error('Error al compartir:', err);
      // No mostrar error al usuario si fue una cancelación
      if ((err as Error).name !== 'AbortError') {
        alert('No se pudo compartir la oferta. Intenta copiar el enlace manualmente.');
      }
    } finally {
      // Desactivar cooldown después de 1 segundo
      setTimeout(() => {
        this.ngZone.run(() => {
          this.iconStates[jobOffer.id!] = { ...this.iconStates[jobOffer.id!], cooldown: false };
        });
      }, 1000);
    }
  }

  // Método para manejar la aplicación a una oferta de trabajo
  onApply(jobOffer: JobOffer, event: Event): void {
    event.stopPropagation();

    // Verificar si ya se está procesando una aplicación para esta oferta
    if (this.isApplying[jobOffer.id!]) {
      return;
    }

    // Mostrar el modal de confirmación
    this.confirmationModalService.show(
      {
        title: 'Confirmar aplicación',
        message: `¿Estás seguro de que deseas aplicar a la oferta de ${jobOffer.title} en ${jobOffer.companyName}?`,
        confirmText: 'Sí, aplicar',
        cancelText: 'Cancelar'
      },
      () => {
        // Código que se ejecutará si el usuario confirma
        this.processApplication(jobOffer);
      },
      () => {
        // Código que se ejecutará si el usuario cancela
        console.log('Aplicación cancelada por el usuario');
      }
    );
  }

  // Método para procesar la aplicación a la oferta
  private processApplication(jobOffer: JobOffer): void {
    // Marcar que se está procesando la aplicación
    this.isApplying[jobOffer.id!] = true;

    // Llamar al servicio para procesar la aplicación
    this.jobInteractionService.toggleApply(jobOffer).subscribe({
      next: (success) => {
        if (success) {
          // Actualizar la UI para reflejar que el usuario ha aplicado
          jobOffer.hasApplied = true;
          // Mostrar mensaje de éxito
          console.log('¡Has aplicado exitosamente a esta oferta!');
        } else {
          console.warn('No se pudo procesar la aplicación a la oferta');
        }
        // Restablecer el estado de carga
        this.isApplying[jobOffer.id!] = false;
      },
      error: (error) => {
        console.error('Error al aplicar a la oferta:', error);
        // Restablecer el estado de carga en caso de error
        this.isApplying[jobOffer.id!] = false;
      }
    });
  }

  // Método para alternar iconos
  toggleIcon(jobOffer: JobOffer, iconType: 'heart' | 'bookmark' | 'share', event: Event): void {
    event.stopPropagation();

    if (iconType === 'heart') {
      this.jobInteractionService.toggleLike(jobOffer, this.iconStates).subscribe();
    } else if (iconType === 'bookmark') {
      this.jobInteractionService.toggleSave(jobOffer, this.iconStates).subscribe();
    } else {
      // Para otros tipos de iconos (como 'share')
      this.jobInteractionService.toggleIcon(jobOffer, iconType, this.iconStates).subscribe();
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
