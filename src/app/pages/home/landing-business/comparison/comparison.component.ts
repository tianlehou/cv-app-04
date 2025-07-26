import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

interface ComparisonFeature {
  name: string;
  talentoVisual: boolean | string;
  otros: boolean | string;
  icon: string;
}

@Component({
  selector: 'app-business-comparison',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './comparison.component.html',
  styleUrl: './comparison.component.css'
})
export class BusinessComparisonComponent {
  title: string = '¿Por qué elegir TalentoVisual?';
  subtitle: string = 'Compara con los métodos tradicionales de reclutamiento';
  
  features: ComparisonFeature[] = [
    {
      name: 'Verificación de habilidades',
      talentoVisual: 'Videos demostrativos',
      otros: 'Solo referencias escritas',
      icon: 'fa-check-circle'
    },
    {
      name: 'Tiempo de contratación',
      talentoVisual: '2-5 días',
      otros: '3-6 semanas',
      icon: 'fa-clock'
    },
    {
      name: 'Costo por contratación',
      talentoVisual: 'Bajo',
      otros: 'Alto',
      icon: 'fa-tag'
    },
    {
      name: 'Tasa de retención',
      talentoVisual: '90%',
      otros: '60-70%',
      icon: 'fa-chart-line'
    },
    {
      name: 'Acceso a talento',
      talentoVisual: 'Directo',
      otros: 'A través de intermediarios',
      icon: 'fa-users'
    },
    {
      name: 'Soporte post-contratación',
      talentoVisual: 'Incluido',
      otros: 'Adicional',
      icon: 'fa-headset'
    }
  ];

  getIconClass(value: boolean | string): string {
    if (typeof value === 'boolean') {
      return value ? 'fas fa-check text-success' : 'fas fa-times text-danger';
    }
    return '';
  }
}
