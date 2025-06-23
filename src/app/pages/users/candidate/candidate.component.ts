import { Component, OnInit, Input } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../home/auth/auth.service';
import { FirebaseService } from 'src/app/shared/services/firebase.service';

// Profile Components
import { ProfilePictureComponent } from './sections/profile/profile-picture/profile-picture.component';
import { PersonalDataComponent } from './sections/profile/personal-data/personal-data.component';
import { GalleryComponent } from './sections/profile/galerry/gallery.component';

// Others components
import { SidebarComponent } from './sidebar/sidebar.component';
import { HomeComponent } from './sections/home/home.component';
import { SubscriptionComponent } from './sections/subscription/subscription.component';
import { ReferComponent } from './sections/refer/refer.component';

@Component({
  selector: 'app-candidate',
  standalone: true,
  imports: [
    RouterModule,
    CommonModule,
    SidebarComponent,
    ProfilePictureComponent,
    PersonalDataComponent,
    GalleryComponent,
    HomeComponent,
    SubscriptionComponent,
    ReferComponent,
  ],
  templateUrl: './candidate.component.html',
  styleUrls: ['./candidate.component.css'],
})
export class CandidateComponent implements OnInit {
  @Input() currentUser: any = null;
  @Input() readOnly: boolean = false;
  userRole: string | null = null;
  showSubscription = false;
  activeSection: 'home' | 'profile' | 'subscription' | 'refer' = 'home';

  constructor(
    private firebaseService: FirebaseService,
    private authService: AuthService,
  ) { 
  }

  async ngOnInit(): Promise<void> {
    if (this.readOnly) {
      this.activeSection = 'profile';
    } else {
      // Only initialize user data if not in readOnly mode
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

  showHome() {
    this.showSubscription = false;
    this.activeSection = 'home';
  }

  showProfile() {
    this.showSubscription = false;
    this.activeSection = 'profile';
  }

  toggleRefer() {
    this.activeSection = this.activeSection === 'refer' ? 'profile' : 'refer';
  }

  toggleSubscription() {
    this.showSubscription = !this.showSubscription;
    this.activeSection = this.showSubscription ? 'subscription' : 'profile';
  }
}
