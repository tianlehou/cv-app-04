import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-job-offer-menu',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './job-offer-menu.component.html',
  styleUrls: ['./job-offer-menu.component.css']
})
export class JobOfferMenuComponent {
  @Input() jobOffer: any;
  @Output() info = new EventEmitter<void>();
  @Output() duplicate = new EventEmitter<void>();
  @Output() edit = new EventEmitter<void>();
  @Output() delete = new EventEmitter<void>();
  @Output() publish = new EventEmitter<void>();
  @Output() cancelPublish = new EventEmitter<void>();

  isMenuOpen = false;

  toggleMenu(event: Event): void {
    event.stopPropagation();
    this.isMenuOpen = !this.isMenuOpen;
    
    if (this.isMenuOpen) {
      // Cerrar el menú al hacer clic fuera de él
      const closeMenu = () => {
        this.isMenuOpen = false;
        document.removeEventListener('click', closeMenu);
      };
      setTimeout(() => document.addEventListener('click', closeMenu), 0);
    }
  }

  onInfo(): void {
    this.info.emit();
    this.isMenuOpen = false;
  }

  onDuplicate(): void {
    this.duplicate.emit();
    this.isMenuOpen = false;
  }

  onEdit(): void {
    this.edit.emit();
    this.isMenuOpen = false;
  }

  onDelete(): void {
    this.delete.emit();
    this.isMenuOpen = false;
  }

  onPublish(): void {
    this.publish.emit();
    this.isMenuOpen = false;
  }

  onCancelPublish(): void {
    this.cancelPublish.emit();
    this.isMenuOpen = false;
  }

  stopPropagation(event: Event): void {
    event.stopPropagation();
  }
}
