import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PublicationFormComponent } from './publication-form/publication-form.component';

@Component({
  selector: 'app-business-publication',
  standalone: true,
  imports: [CommonModule, PublicationFormComponent],
  templateUrl: './business-publication.component.html',
  styleUrls: ['./business-publication.component.css']
})
export class BusinessPublicationComponent {

}
