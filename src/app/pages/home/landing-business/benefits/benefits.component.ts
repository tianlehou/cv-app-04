import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

interface BenefitCard {
  icon: string;
  title: string;
  description: string;
  bgColor: string;
  iconColor: string;
}

@Component({
  selector: 'app-business-benefits',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './benefits.component.html',
  styleUrl: './benefits.component.css'
})
export class BusinessBenefitsComponent {
  title: string = 'Beneficios exclusivos para empresas';
  subtitle: string = 'Todo lo que necesitas para encontrar al candidato ideal';

  benefits: BenefitCard[] = [
    {
      icon: 'fa-filter',
      title: 'Filtrado Inteligente',
      description: 'Busca por habilidades específicas: desde "soldadura TIG" hasta "Python para análisis de datos". Nuestro algoritmo prioriza candidatos con videos verificados.',
      bgColor: 'var(--bg-blue)',
      iconColor: 'var(--clr-blue)'
    },
    {
      icon: 'fa-tachometer-alt',
      title: 'Dashboard Empresarial',
      description: 'Tablero con métricas clave: % de coincidencia, valoraciones de equipo, comparativa entre candidatos. Recibe notificaciones cuando un perfil relevante se registra.',
      bgColor: 'var(--bg-red)',
      iconColor: 'var(--clr-red)'
    },
    {
      icon: 'fa-video',
      title: 'Pruebas Técnicas Visuales',
      description: 'Asigna desafíos prácticos: "Graba un video resolviendo este problema de logística". Compara respuestas de múltiples candidatos en una sola vista.',
      bgColor: 'var(--bg-yellow)',
      iconColor: 'var(--clr-yellow)'
    }
  ];
}
