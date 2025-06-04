import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FirebaseService } from '../../../shared/services/firebase.service';
import { BusinessDashboardComponent } from './business-dashboard/business-dashboard.component';
import { BusinessSidebarComponent } from './sidebar/sidebar.component';
import { AuthService } from '../../home/user-type-modal/auth/auth.service';

@Component({
  selector: 'app-business',
  standalone: true,
  imports: [CommonModule, BusinessSidebarComponent, BusinessDashboardComponent],
  templateUrl: './business.component.html',
  styleUrl: './business.component.css',
})
export class BusinessComponent implements OnInit {
  currentUser: any = null;
  userRole: string | null = null;

  constructor(
    private firebaseService: FirebaseService,
    private authService: AuthService,
  ) {}

  async ngOnInit(): Promise<void> {
    this.authService
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
