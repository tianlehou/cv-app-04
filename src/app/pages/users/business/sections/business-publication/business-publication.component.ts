import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PublicationFormComponent } from './publication-form/publication-form.component';
import { CreatePublicationButtonComponent } from './create-publication-button/create-publication-button.component';

@Component({
  selector: 'app-business-publication',
  standalone: true,
  imports: [CommonModule, PublicationFormComponent, CreatePublicationButtonComponent],
  templateUrl: './business-publication.component.html',
  styleUrls: ['./business-publication.component.css']
})
export class BusinessPublicationComponent {
  showPublicationModal = false;

  togglePublicationModal(show: boolean): void {
    this.showPublicationModal = show;
  }

  onFormSubmitted(): void {
    this.togglePublicationModal(false);
  }
}
