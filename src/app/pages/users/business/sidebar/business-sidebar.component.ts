// business-sidebar.component.ts
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from 'src/app/pages/home/auth/auth.service';

@Component({
  selector: 'app-business-sidebar',
  standalone: true,
  imports: [RouterModule, CommonModule],
  templateUrl: './business-sidebar.component.html',
  styleUrls: ['./business-sidebar.component.css'],
})
export class BusinessSidebarComponent {
  isMenuOpen = false;
  @Input() activeSection: 'dashboard' | 'publications' | 'subscription' = 'dashboard'; 
  @Output() dashboardClicked = new EventEmitter<void>();
  @Output() publicationsClicked = new EventEmitter<void>();
  @Output() subscriptionClicked = new EventEmitter<void>();

  constructor(
    private authService: AuthService,
  ) {}

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
  }

  preventClose(event: Event) {
    event.stopPropagation();
  }

  onDashboardClick() {
    this.dashboardClicked.emit();
    this.toggleMenu();
  }

  onPublicationsClick() {
    this.publicationsClicked.emit();
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