import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Step {
  number: number;
  title: string;
  description: string;
  bgColor: string;
  iconColor: string;
  icon: string;
}

@Component({
  selector: 'app-business-how-it-works',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './how-it-works.component.html',
  styleUrl: './how-it-works.component.css'
})
export class BusinessHowItWorksComponent {
  title: string = 'Cómo funciona TalentoVisual';
  subtitle: string = 'Encuentra al candidato ideal en 3 sencillos pasos';

  steps: Step[] = [
    {
      number: 1,
      title: 'Publica tu vacante',
      description: 'Describe el perfil que buscas y configura los filtros de habilidades, experiencia y disponibilidad.',
      bgColor: 'var(--bg-blue)',
      iconColor: 'var(--clr-blue)',
      icon: 'fa-bullhorn'
    },
    {
      number: 2,
      title: 'Recibe perfiles verificados',
      description: 'Accede a candidatos que ya han demostrado sus habilidades en video. Filtra y ordena según tus necesidades.',
      bgColor: 'var(--bg-red)',
      iconColor: 'var(--clr-red)',
      icon: 'fa-users'
    },
    {
      number: 3,
      title: 'Contrata con confianza',
      description: 'Compara candidatos, realiza entrevistas y toma decisiones basadas en demostraciones reales de habilidades.',
      bgColor: 'var(--bg-yellow)',
      iconColor: 'var(--clr-yellow)',
      icon: 'fa-handshake'
    }
  ];
}
