import { Component } from '@angular/core';
import { GalleryComponent } from '../../../profile/galerry/gallery.component';
import { ProfilePictureComponent } from '../../../profile/profile-picture/profile-picture.component';
import { PersonalDataComponent } from '../../../profile/personal-data/personal-data.component';

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
