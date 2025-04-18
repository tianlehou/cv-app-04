import { Component, Output, EventEmitter, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-user-type-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './user-type-modal.component.html',
  styleUrls: ['./user-type-modal.component.css']
})
export class UserTypeModalComponent {
  isVisible = false;
  @Output() userTypeSelected = new EventEmitter<'candidate' | 'company'>();

  openModal() {
    this.isVisible = true;
    document.body.classList.add('modal-open');
  }

  closeModal() {
    this.isVisible = false;
    document.body.classList.remove('modal-open');
    const backdrops = document.getElementsByClassName('modal-backdrop');
    while (backdrops.length > 0) {
      backdrops[0].remove();
    }
  }

  selectUserType(type: 'candidate' | 'company') {
    this.userTypeSelected.emit(type);
    this.closeModal();
  }

  // Maneja el clic fuera del modal
  onBackdropClick(event: MouseEvent) {
    const modalContent = document.querySelector('.modal-content');
    if (event.target === event.currentTarget) {
      this.closeModal();
    }
  }

  // Cierra el modal con la tecla Escape
  @HostListener('document:keydown.escape', ['$event'])
  onKeydownHandler(event: KeyboardEvent) {
    if (this.isVisible) {
      this.closeModal();
    }
  }
}