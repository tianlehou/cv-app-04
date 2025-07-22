import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Feature {
  icon: string;
  title: string;
  description: string;
  bgColor: string;
  iconColor: string;
}

@Component({
  selector: 'app-features-section',
  standalone: true,
  imports: [CommonModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './features-section.component.html',
  styleUrls: ['./features-section.component.css']
})
export class FeaturesSectionComponent {
  features: Feature[] = [
    {
      icon: 'camera-outline',
      title: 'Portafolio visual',
      description: 'Sube fotos y videos de tu trabajo real. Muestra tus habilidades en acción, no solo en papel.',
      bgColor: 'var(--bg-blue)',
      iconColor: 'var(--clr-blue)'
    },
    {
      icon: 'flash-outline',
      title: 'Algoritmo inteligente',
      description: 'Conectamos tu perfil con empleadores que buscan exactamente tus habilidades y experiencia.',
      bgColor: 'var(--bg-green)',
      iconColor: 'var(--clr-green)'
    },
    {
      icon: 'time-outline',
      title: 'Ahorra tiempo',
      description: 'Sin gastar en pasajes, filas o currículums impresos. Todo se hace en línea, desde tu casa.',
      bgColor: 'var(--bg-yellow)',
      iconColor: 'var(--clr-yellow)'
    },
    {
      icon: 'globe-outline',
      title: 'Visibilidad global',
      description: 'Accede a oportunidades laborales locales e internacionales sin moverte de tu ciudad.',
      bgColor: 'var(--bg-orange)',
      iconColor: 'var(--clr-orange)'
    },
    {
      icon: 'refresh-outline',
      title: 'Actualización continua',
      description: 'Edita y mejora tu currículum en cualquier momento. Mantén tu perfil siempre actualizado.',
      bgColor: 'var(--bg-red)',
      iconColor: 'var(--clr-red)'
    },
    {
      icon: 'stats-chart-outline',
      title: 'Estadísticas detalladas',
      description: 'Observa cuántas empresas han visto tu perfil y qué habilidades generan más interés.',
      bgColor: 'var(--bg-purple)',
      iconColor: 'var(--clr-purple)'
    },
    {
      icon: 'chatbubbles-outline',
      title: 'Mensajería directa',
      description: 'Comunícate directamente con los empleadores sin intermediarios ni costos ocultos.',
      bgColor: 'var(--bg-blue)',
      iconColor: 'var(--clr-blue)'
    },
    {
      icon: 'ribbon-outline',
      title: 'Certificaciones verificadas',
      description: 'Destaca tus certificaciones con verificación automática para mayor credibilidad.',
      bgColor: 'var(--bg-green)',
      iconColor: 'var(--clr-green)'
    },
    {
      icon: 'people-outline',
      title: 'Comunidad activa',
      description: 'Conecta con otros profesionales de tu sector y amplía tu red de contactos.',
      bgColor: 'var(--bg-yellow)',
      iconColor: 'var(--clr-yellow)'
    },
    {
      icon: 'shield-checkmark-outline',
      title: 'Privacidad garantizada',
      description: 'Tú controlas qué información es visible y quién puede ver tu perfil.',
      bgColor: 'var(--bg-orange)',
      iconColor: 'var(--clr-orange)'
    },
    {
      icon: 'briefcase-outline',
      title: 'Oportunidades exclusivas',
      description: 'Acceso a ofertas de trabajo que no encontrarás en otros sitios.',
      bgColor: 'var(--bg-red)',
      iconColor: 'var(--clr-red)'
    },
    {
      icon: 'trending-up-outline',
      title: 'Seguimiento de progreso',
      description: 'Mide cómo mejora tu perfil y recibe recomendaciones personalizadas.',
      bgColor: 'var(--bg-purple)',
      iconColor: 'var(--clr-purple)'
    },
    {
      icon: 'document-text-outline',
      title: 'Plantillas profesionales',
      description: 'Crea currículums atractivos con nuestras plantillas diseñadas por expertos.',
      bgColor: 'var(--bg-blue)',
      iconColor: 'var(--clr-blue)'
    },
    {
      icon: 'megaphone-outline',
      title: 'Alertas personalizadas',
      description: 'Recibe notificaciones cuando haya trabajos que coincidan con tu perfil.',
      bgColor: 'var(--bg-green)',
       iconColor: 'var(--clr-green)'
    },
    {
      icon: 'star-outline',
      title: 'Destaca tu perfil',
      description: 'Obtén visibilidad premium para que los empleadores te encuentren primero.',
      bgColor: 'var(--bg-yellow)',
      iconColor: 'var(--clr-yellow)'
    }
  ];
}
