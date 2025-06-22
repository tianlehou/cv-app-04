import { Component } from '@angular/core';

@Component({
  selector: 'app-candidate-examples-modal',
  standalone: true,
  imports: [],
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
