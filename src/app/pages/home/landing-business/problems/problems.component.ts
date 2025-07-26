import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

interface ProblemCard {
  icon: string;
  title: string;
  description: string;
  isSolution?: boolean;
}

interface StatItem {
  value: string;
  label: string;
}

@Component({
  selector: 'app-business-problems',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './problems.component.html',
  styleUrl: './problems.component.css'
})
export class BusinessProblemsComponent {
  title: string = 'El reclutamiento tradicional te está costando tiempo y dinero';
  subtitle: string = 'Estos son los problemas que TalentoVisual resuelve para tu empresa';
  
  problemCards: ProblemCard[] = [
    {
      icon: 'fa-clock',
      title: '3 semanas filtrando CVs',
      description: 'Pierdes horas valiosas revisando cientos de currículums que no reflejan habilidades reales. El 65% de los candidatos exageran sus capacidades (Fuente: Harvard Business Review).',
      isSolution: false
    },
    {
      icon: 'fa-bolt',
      title: '2 horas viendo videos demostrativos',
      description: 'Con TalentoVisual, en menos de una jornada laboral puedes evaluar a decenas de candidatos mostrando exactamente lo que saben hacer.',
      isSolution: true
    }
  ];

  stats: StatItem[] = [
    { value: '70%', label: 'menos tiempo en procesos de selección' },
    { value: '60%', label: 'reducción en contrataciones fallidas' },
    { value: '92%', label: 'retención a 6 meses' }
  ];
}
