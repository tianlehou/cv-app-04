import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FirebaseService } from '../../../shared/services/firebase.service';
import { SidebarComponent } from '../../../shared/components/buttons/sidebar/sidebar.component';
import { AdminDashboardComponent } from './dashboard/dashboard.component';

@Component({
  selector: 'app-main',
  standalone: true,
  imports: [CommonModule, SidebarComponent, AdminDashboardComponent],
  templateUrl: './main.component.html',
  styleUrl: './main.component.css',
})
export class MainComponent implements OnInit {
  currentUser: any = null; // Usa el tipo correcto según tu aplicación
  userRole: string | null = null;

  constructor(private firebaseService: FirebaseService) {} // Inyecta el servicio

  async ngOnInit(): Promise<void> {
    // Usa el método del servicio para obtener el estado de autenticación
    this.firebaseService
      .isAuthenticated()
      .subscribe(async (isAuthenticated) => {
        if (isAuthenticated) {
          this.currentUser = await this.firebaseService.getCurrentUser();
          console.log('Usuario autenticado:', this.currentUser.email);

          // Obtener el rol usando el servicio
          const userData = await this.firebaseService.getUserData(
            this.currentUser.email.replace(/\./g, '_')
          );
          this.userRole = userData?.role || null;
          console.log('Rol del usuario:', this.userRole);
        } else {
          console.error('Usuario no autenticado.');
        }
      });
  }
}
