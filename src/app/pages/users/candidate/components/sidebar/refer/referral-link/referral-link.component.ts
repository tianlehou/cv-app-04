// refer.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FirebaseService } from '../../../../../../../shared/services/firebase.service';
import { ToastService } from '../../../../../../../shared/services/toast.service';
import { UrlService } from '../url.service';

@Component({
  selector: 'app-referral-link',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './referral-link.component.html',
  styleUrls: ['./referral-link.component.css'],
})
export class ReferralLinkComponent implements OnInit {
  referralLink = '';
  currentUser: any;
  isCopied = false;
  get canShare(): boolean {
    return !!window.navigator.share;
  }

  constructor(
    private firebaseService: FirebaseService,
    private toastService: ToastService,
    private urlService: UrlService
  ) {}

  async ngOnInit() {
    try {
      this.currentUser = await this.firebaseService.getCurrentUser();
      if (this.currentUser?.metadata?.userId) {
        // Usar UrlService para generar el link
        this.referralLink = this.urlService.generateReferralLink(
          this.currentUser.metadata.userId
        );
      } else {
        console.warn('No user ID found for current user');
      }
    } catch (error) {
      console.error('Error fetching current user:', error);
    }
  }

  copyToClipboard() {
    navigator.clipboard
      .writeText(this.referralLink)
      .then(() => {
        this.toastService.show('Enlace copiado al portapeles', 'success');
        this.isCopied = true;
        setTimeout(() => (this.isCopied = false), 2000);
      })
      .catch((err) => {
        console.error('Error al copiar: ', err);
        this.toastService.show('Error al copiar el enlace', 'error');
      });
  }

  private showDesktopShareOptions() {
    const shareText = `Regístrate usando mi enlace: ${this.referralLink}`;
    const emailUrl = `_streams://localhost:4200?subject=Únete a esta aplicación&body=${encodeURIComponent(
      shareText
    )}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;

    this.toastService.show(
      'Enlace listo para compartir. Puedes pegarlo donde quieras.',
      'info',
      3000
    );
    this.copyToClipboard(); // Copia automáticamente al mostrar las opciones
  }

  async shareLink() {
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Únete a esta aplicación',
          text: 'Regístrate usando mi enlace de referido',
          url: this.referralLink,
        });
        this.toastService.show('Enlace compartido con éxito', 'success');
      } else {
        this.showDesktopShareOptions();
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        // No mostrar error si el usuario cancela
        console.error('Error al compartir:', err);
        this.toastService.show('Error al compartir el enlace', 'error');
      }
    }
  }

  shareVia(platform: string) {
    const shareText = `Regístrate usando mi enlace: ${this.referralLink}`;

    switch (platform) {
      case 'whatsapp':
        window.open(
          `https://wa.me/?text=${encodeURIComponent(shareText)}`,
          '_blank'
        );
        break;
      case 'email':
        window.open(
          `mailto:?subject=Únete a esta aplicación&body=${encodeURIComponent(
            shareText
          )}`,
          '_blank'
        );
        break;
      case 'facebook':
        window.open(
          `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
            this.referralLink
          )}`,
          '_blank'
        );
        break;
      case 'twitter':
        window.open(
          `https://twitter.com/intent/tweet?text=${encodeURIComponent(
            shareText
          )}`,
          '_blank'
        );
        break;
    }
  }
}
