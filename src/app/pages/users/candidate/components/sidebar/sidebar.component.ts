// sidebar.component.ts
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FirebaseService } from '../../../../../shared/services/firebase.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterModule, CommonModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css'],
})
export class SidebarComponent {
  isMenuOpen = false;
  @Input() activeSection: 'home' | 'subscription' | 'refer' = 'home'; 
  @Output() homeClicked = new EventEmitter<void>();
  @Output() subscriptionClicked = new EventEmitter<void>();
  @Output() referClicked = new EventEmitter<void>();

  constructor(private firebaseService: FirebaseService) {}

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
  }

  preventClose(event: Event) {
    event.stopPropagation();
  }

  onHomeClick() {
    this.homeClicked.emit();
    this.toggleMenu(); // Opcional: cerrar el menú después de hacer clic
  }

  onSubscriptionClick() {
    this.subscriptionClicked.emit();
    this.toggleMenu();
  }

  onReferClick() {
    this.referClicked.emit();
    this.toggleMenu();
  }

  // Llama al método logout de firebase.service
  logout() {
    this.firebaseService.logout();
  }
}
