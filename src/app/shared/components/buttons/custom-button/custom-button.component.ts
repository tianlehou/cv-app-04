import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-custom-button',
  standalone: true, // Define el componente como standalone
  imports: [CommonModule], // Importa el CommonModule si es necesario
  template: `<button class="custom-button">{{ label }}</button>`,
  styleUrls: ['./custom-button.component.css']
})
export class CustomButtonComponent {
  @Input() label: string = 'Botón'; // Texto por defecto del botón
}
