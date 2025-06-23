import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-hero-section',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './hero-section.component.html',
  styleUrls: ['./hero-section.component.css'],
})
export class HeroSectionComponent {
  @Output() startNow = new EventEmitter<void>();

  onStartNow(): void {
    this.startNow.emit();
  }

  openExamplesModal() {
    const modal = document.getElementById('candidateExamplesModal');
    if (modal) {
      modal.style.display = 'flex';
    }
  }
}
