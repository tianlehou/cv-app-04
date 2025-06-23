import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CandidateExamplesModalComponent } from './candidate-examples-modal/candidate-examples-modal.component';

@Component({
  selector: 'app-hero-section',
  standalone: true,
  imports: [CommonModule, CandidateExamplesModalComponent],
  templateUrl: './hero-section.component.html',
  styleUrls: ['./hero-section.component.css'],
})
export class HeroSectionComponent {
  @Output() startNow = new EventEmitter<void>();
  isModalVisible = false;

  onStartNow(): void {
    this.startNow.emit();
  }

  showExamplesModal(): void {
    this.isModalVisible = true;
  }

  onCloseModal(): void {
    this.isModalVisible = false;
  }
}
