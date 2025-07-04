import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Feature {
  icon: string;
  title: string;
  description: string;
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
      description: 'Sube fotos y videos de tu trabajo real. Muestra tus habilidades en acción, no solo en papel.'
    },
    {
      icon: 'flash-outline',
      title: 'Algoritmo inteligente',
      description: 'Conectamos tu perfil con empleadores que buscan tus habilidades.'
    },
    {
      icon: 'time-outline',
      title: 'Ahorra tiempo',
      description: 'Sin gastar en pasajes, filas o currículums impresos. Todo se hace en línea, desde tu casa.'
    },
    {
      icon: 'globe-outline',
      title: 'Visibilidad global',
      description: 'Accede a oportunidades laborales locales e internacionales sin moverte de tu ciudad.'
    }
  ];
}
