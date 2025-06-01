import { Component, CUSTOM_ELEMENTS_SCHEMA, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CandidateComponent } from 'src/app/pages/users/candidate/candidate.component';


@Component({
  selector: 'app-candidate-profile-modal',
  standalone: true,
  imports: [CommonModule, CandidateComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './candidate-profile-modal.component.html',
  styleUrls: ['./candidate-profile-modal.component.css']
})
export class CandidateProfileModalComponent {
  @Input() user: any;
  @Input() close!: () => void;
}
