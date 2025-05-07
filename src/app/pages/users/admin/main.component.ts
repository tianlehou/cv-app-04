import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FirebaseService } from '../../../shared/services/firebase.service';
import { AdminDashboardComponent } from './dashboard/dashboard.component';
import { SidebarComponent } from './sidebar/sidebar.component';

@Component({
  selector: 'app-main',
  standalone: true,
  imports: [CommonModule, SidebarComponent, AdminDashboardComponent],
  templateUrl: './main.component.html',
  styleUrl: './main.component.css',
})
export class MainComponent implements OnInit {
  currentUser: any = null;
  userRole: string | null = null;

  constructor(private firebaseService: FirebaseService) {}

  async ngOnInit(): Promise<void> {
    this.firebaseService
      .isAuthenticated()
      .subscribe(async (isAuthenticated) => {
        if (isAuthenticated) {
          this.currentUser = await this.firebaseService.getCurrentUser();
          console.log('Usuario autenticado:', this.currentUser.email);

          // Obtener el rol usando firebase.service
          const userEmailKey = this.firebaseService.formatEmailKey(this.currentUser.email);
          const userData = await this.firebaseService.getUserData(userEmailKey);
          this.userRole = userData?.metadata?.role || null;
          console.log('Rol del usuario:', this.userRole);
        } else {
          console.error('Usuario no autenticado.');
        }
      });
  }
}
