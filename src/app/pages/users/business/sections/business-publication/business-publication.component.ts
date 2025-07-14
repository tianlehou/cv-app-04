import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PublicationFormComponent } from './publication-form/publication-form.component';
import { CreatePublicationButtonComponent } from './create-publication-button/create-publication-button.component';
import { EmptyPublicationMessageComponent } from './empty-publication-message/empty-publication-message.component';

@Component({
  selector: 'app-business-publication',
  standalone: true,
  imports: [
    CommonModule, 
    PublicationFormComponent, 
    CreatePublicationButtonComponent,
    EmptyPublicationMessageComponent
  ],
  templateUrl: './business-publication.component.html',
  styleUrls: ['./business-publication.component.css']
})
export class BusinessPublicationComponent {
  showPublicationModal = false;
  hasPublications = false; // Cambiar a false cuando no haya publicaciones

  togglePublicationModal(show: boolean): void {
    this.showPublicationModal = show;
  }

  onFormSubmitted(): void {
    this.togglePublicationModal(false);
  }

  // Se llama cuando se guarda exitosamente una publicación
  onPublicationSaved(): void {
    this.togglePublicationModal(false);
    this.hasPublications = true; // Actualizar el estado para ocultar el mensaje de vacío
  }
}
