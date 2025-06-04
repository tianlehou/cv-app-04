// business-candidate-profile-modal.component.ts
import { Component, CUSTOM_ELEMENTS_SCHEMA, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CandidateComponent } from 'src/app/pages/users/candidate/candidate.component';

@Component({
  selector: 'app-business-candidate-profile-modal',
  standalone: true,
  imports: [CommonModule, CandidateComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './business-candidate-profile-modal.component.html',
  styleUrls: ['./business-candidate-profile-modal.component.css']
})
export class BusinessCandidateProfileModalComponent {
  @Input() user: any;
  @Input() close!: () => void;

  get readOnly(): boolean {
    return true;
  }

  get isOwner(): boolean {
    return false; // Siempre false, ignora cualquier input
  }
}