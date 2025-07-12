// business.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FirebaseService } from '../../../shared/services/firebase.service';
import { AuthService } from '../../home/auth/auth.service';
import { BusinessSidebarComponent } from './sidebar/business-sidebar.component';
import { BusinessDashboardComponent } from './sections/business-dashboard/business-dashboard.component';
import { BusinessSubscriptionComponent } from './sections/business-subscription/business-subscription.component';
import { BusinessPublicationComponent } from './sections/business-publication/business-publication.component';

@Component({
  selector: 'app-business',
  standalone: true,
  imports: [
    CommonModule, 
    BusinessSidebarComponent, 
    BusinessDashboardComponent, 
    BusinessSubscriptionComponent,
    BusinessPublicationComponent
  ],
  templateUrl: './business.component.html',
  styleUrl: './business.component.css',
})
export class BusinessComponent implements OnInit {
  currentUser: any = null;
  userRole: string | null = null;
  activeSection: 'home' | 'publications' | 'subscription' = 'home';

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

          const userEmailKey = this.firebaseService.formatEmailKey(this.currentUser.email);
          const userData = await this.firebaseService.getUserData(userEmailKey);
          this.userRole = userData?.metadata?.role || null;
          console.log('Rol del usuario:', this.userRole);
        } else {
          console.error('Usuario no autenticado.');
        }
      });
  }

  toggleSubscription() {
    this.activeSection = this.activeSection === 'subscription' ? 'home' : 'subscription';
  }

  showHome() {
    this.activeSection = 'home';
  }

  showPublications() {
    this.activeSection = 'publications';
  }
}