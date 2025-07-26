import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Testimonial {
  id: number;
  name: string;
  role: string;
  company: string;
  avatar: string;
  content: string;
  rating: number;
}

@Component({
  selector: 'app-business-testimonials',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './testimonials.component.html',
  styleUrl: './testimonials.component.css'
})
export class BusinessTestimonialsComponent {
  title: string = 'Lo que dicen las empresas';
  subtitle: string = 'Empresas que ya confían en TalentoVisual para sus procesos de selección';
  
  testimonials: Testimonial[] = [
    {
      id: 1,
      name: 'María González',
      role: 'Directora de RRHH',
      company: 'TecnoSoluciones',
      avatar: 'assets/images/avatar1.jpg',
      content: 'Redujimos el tiempo de contratación de 3 semanas a 4 días. La calidad de los candidatos es excepcional, especialmente al poder ver sus habilidades en acción.',
      rating: 5
    },
    {
      id: 2,
      name: 'Carlos Mendoza',
      role: 'Gerente de Talento',
      company: 'LogiTech',
      avatar: 'assets/images/avatar2.jpg',
      content: 'El dashboard de comparación nos ahorra horas de análisis. Ahora todo el equipo de contratación puede evaluar candidatos de manera objetiva.',
      rating: 5
    },
    {
      id: 3,
      name: 'Ana Torres',
      role: 'CEO',
      company: 'StartUp Innovate',
      avatar: 'assets/images/avatar3.jpg',
      content: 'Como startup, no teníamos recursos para un proceso de reclutamiento extenso. TalentoVisual nos dio acceso a talento verificada de forma rápida y económica.',
      rating: 4
    }
  ];

  currentIndex: number = 0;

  nextTestimonial(): void {
    this.currentIndex = (this.currentIndex + 1) % this.testimonials.length;
  }

  prevTestimonial(): void {
    this.currentIndex = (this.currentIndex - 1 + this.testimonials.length) % this.testimonials.length;
  }

  goToTestimonial(index: number): void {
    this.currentIndex = index;
  }
}
