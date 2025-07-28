// sidebar.component.ts
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
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
  @Input() activeSection: 'profile' | 'subscription' | 'refer' | 'professional-development' | 'announcements' = 'profile';
  @Output() homeClicked = new EventEmitter<void>();
  @Output() profileClicked = new EventEmitter<void>();
  @Output() subscriptionClicked = new EventEmitter<void>();
  @Output() referClicked = new EventEmitter<void>();
  @Output() professionalDevelopmentClicked = new EventEmitter<void>();
  @Output() announcementsClicked = new EventEmitter<void>();
  
  // Definir el tipo para las secciones
  sectionType = {
    profile: 'profile',
    subscription: 'subscription',
    refer: 'refer',
    professionalDevelopment: 'professional-development',
    announcements: 'announcements'
  } as const;

  constructor(
    private authService: AuthService,
  ) { }

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

  onProfessionalDevelopmentClick() {
    this.professionalDevelopmentClicked.emit();
    this.toggleMenu();
  }

  onAnnouncementsClick() {
    this.announcementsClicked.emit();
    this.toggleMenu();
  }

  // Llama al método logout de firebase.service
  logout() {
    this.authService.logout();
  }
}
