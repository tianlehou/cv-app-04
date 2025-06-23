import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-call-to-action',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './call-to-action.component.html',
  styleUrls: ['./call-to-action.component.css'],
})
export class CallToActionComponent {
  title = '¿Listo para que te vean y te contraten?';
  description = 'Únete a miles de profesionales que ya encontraron trabajo mostrando su talento real. ¡Solo toma 2 minutos!';
  buttonText = 'Regístrate Gratis';
}
