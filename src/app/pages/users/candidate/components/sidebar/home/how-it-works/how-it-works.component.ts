import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Step {
  number: number;
  title: string;
  description: string;
}

@Component({
  selector: 'app-how-it-works',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './how-it-works.component.html',
  styleUrls: ['./how-it-works.component.css']
})
export class HowItWorksComponent {
  steps: Step[] = [
    {
      number: 1,
      title: 'Crea tu perfil',
      description: 'Llena tus datos básicos y añade fotos de tu trabajo y experiencia.'
    },
    {
      number: 2,
      title: 'Sube tu "Demo Laboral"',
      description: 'Graba un video corto mostrando tus habilidades (ej: "Mira cómo preparo un plato estrella").'
    },
    {
      number: 3,
      title: 'Recibe ofertas',
      description: 'Las empresas te contactarán directamente cuando encajes en sus vacantes.'
    }
  ];
}
