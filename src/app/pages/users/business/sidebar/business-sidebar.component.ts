// business-sidebar.component.ts
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from 'src/app/pages/home/auth/auth.service';
import { FirebaseService } from 'src/app/shared/services/firebase.service';

@Component({
  selector: 'app-business-sidebar',
  standalone: true,
  imports: [RouterModule, CommonModule],
  templateUrl: './business-sidebar.component.html',
  styleUrls: ['./business-sidebar.component.css'],
})
export class BusinessSidebarComponent {
  isMenuOpen = false;
  @Input() activeSection: 'home' | 'subscription' = 'home'; 
  @Output() homeClicked = new EventEmitter<void>();
  @Output() subscriptionClicked = new EventEmitter<void>();

  constructor(
    private firebaseService: FirebaseService,
    private authService: AuthService,
  ) {}

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
  }

  preventClose(event: Event) {
    event.stopPropagation();
  }

  onHomeClick() {
    this.homeClicked.emit();
    this.toggleMenu();
  }

  onSubscriptionClick() {
    this.subscriptionClicked.emit();
    this.toggleMenu();
  }

  logout() {
    this.authService.logout();
  }
}