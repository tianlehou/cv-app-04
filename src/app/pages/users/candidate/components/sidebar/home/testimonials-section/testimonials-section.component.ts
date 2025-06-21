import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Testimonial {
  text: string;
  author: string;
  role: string;
}

@Component({
  selector: 'app-testimonials-section',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './testimonials-section.component.html',
  styleUrls: ['./testimonials-section.component.css']
})
export class TestimonialsSectionComponent {
  testimonials: Testimonial[] = [
    {
      text: '"Gracias a los videos que subí, un restaurante en España me contrató como chef. ¡Nunca pensé que sería tan fácil!"',
      author: 'Carlos',
      role: 'Chef'
    },
    {
      text: '"Subí un video arreglando un motor y al día siguiente me llamaron de un taller. Ahora tengo trabajo estable."',
      author: 'Ana',
      role: 'Mecánica'
    },
    {
      text: '"Las empresas me contactaban a mí gracias a mi perfil visual. En una semana tenía 3 ofertas para elegir."',
      author: 'Miguel',
      role: 'Electricista'
    }
  ];
}
