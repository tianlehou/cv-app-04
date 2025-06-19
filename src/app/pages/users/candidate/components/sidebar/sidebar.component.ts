// sidebar.component.ts
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FirebaseService } from 'src/app/shared/services/firebase.service';
import { AuthService } from 'src/app/pages/home/auth/auth.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterModule, CommonModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css'],
})
export class SidebarComponent {
  isMenuOpen = false;
  @Input() activeSection: 'profile' | 'subscription' | 'refer' = 'profile'; 
  @Output() profileClicked = new EventEmitter<void>();
  @Output() subscriptionClicked = new EventEmitter<void>();
  @Output() referClicked = new EventEmitter<void>();

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

onProfileClick() {
  this.profileClicked.emit();
  this.toggleMenu();
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
    this.authService.logout();
  }
}
