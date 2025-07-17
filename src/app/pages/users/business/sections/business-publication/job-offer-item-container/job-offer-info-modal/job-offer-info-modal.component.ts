import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-job-offer-info-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './job-offer-info-modal.component.html',
  styleUrls: ['./job-offer-info-modal.component.css']
})
export class JobOfferInfoModalComponent {
  @Output() closeModal = new EventEmitter<void>();

  onClose(): void {
    this.closeModal.emit();
  }

  // Evita que el clic en el contenido del modal cierre el modal
  onContentClick(event: Event): void {
    event.stopPropagation();
  }
}
