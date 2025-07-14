import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-empty-publication-message',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './empty-publication-message.component.html',
  styleUrls: ['./empty-publication-message.component.css']
})
export class EmptyPublicationMessageComponent {
  // No se necesitan propiedades adicionales por ahora
}
