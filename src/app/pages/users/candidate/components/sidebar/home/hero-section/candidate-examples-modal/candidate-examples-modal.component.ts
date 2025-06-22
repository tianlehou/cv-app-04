import { Component } from '@angular/core';
import { GalleryComponent } from '../../../../gallery/gallery.component';
import { ProfilePictureComponent } from '../../../../profile-picture/profile-picture.component';
import { PersonalDataComponent } from '../../../../personal-data/personal-data.component';

@Component({
  selector: 'app-candidate-examples-modal',
  standalone: true,
  imports: [ProfilePictureComponent, PersonalDataComponent, GalleryComponent],
  templateUrl: './candidate-examples-modal.component.html',
  styleUrls: ['./candidate-examples-modal.component.css']
})
export class CandidateExamplesModalComponent {
  closeModal() {
    const modal = document.getElementById('candidateExamplesModal');
    if (modal) {
      modal.style.display = 'none';
    }
  }
}
