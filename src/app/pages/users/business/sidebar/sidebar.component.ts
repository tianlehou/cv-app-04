// sidebar.component.ts
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from 'src/app/pages/home/user-type-modal/auth/auth.service';

@Component({
  selector: 'app-business-sidebar',
  standalone: true,
  imports: [RouterModule, CommonModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css'],
})
export class BusinessSidebarComponent {
  isMenuOpen = false;

  constructor(
    private authService: AuthService,
  ) {}

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
  }

  preventClose(event: Event) {
    event.stopPropagation();
  }

  // Llama al método logout de firebase.service
  logout() {
    this.authService.logout();
  }
}
