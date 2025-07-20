import { Component, OnInit, Input } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../home/auth/auth.service';
import { FirebaseService } from 'src/app/shared/services/firebase.service';

// Profile Components
import { ProfilePictureComponent } from './sections/profile/profile-picture/profile-picture.component';
import { PersonalDataComponent } from './sections/profile/personal-data/personal-data.component';
import { GalleryComponent } from './sections/profile/gallery/gallery.component';

// Others components
import { SidebarComponent } from './sidebar/sidebar.component';
import { HomeComponent } from './sections/home/home.component';
import { SubscriptionComponent } from './sections/subscription/subscription.component';
import { ReferComponent } from './sections/refer/refer.component';
import { HeroSectionComponent } from './sections/home/hero-section/hero-section.component';
import { ProfessionalDevelopmentComponent } from './sections/professional-development/professional-development.component';

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
    HeroSectionComponent,
    ProfessionalDevelopmentComponent,
  ],
  templateUrl: './candidate.component.html',
  styleUrls: ['./candidate.component.css'],
})
export class CandidateComponent implements OnInit {
  @Input() currentUser: any = null;
  @Input() readOnly: boolean = false;
  @Input() isExample: boolean = false;
  userRole: string | null = null;
  isEditor: boolean = false;
  showSubscription = false;
  // Usar el mismo tipo que en el sidebar para mantener consistencia
  activeSection: 'home' | 'profile' | 'subscription' | 'refer' | 'professional-development' = 'home';
  
  // Definir el tipo para las secciones (igual que en sidebar.component.ts)
  sectionType = {
    home: 'home',
    profile: 'profile',
    subscription: 'subscription',
    refer: 'refer',
    professionalDevelopment: 'professional-development'
  } as const;

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
            this.isEditor = userData?.metadata?.isEditor === true;
            console.log('Rol del usuario:', this.userRole);
            console.log('Es editor:', this.isEditor);
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
    this.activeSection = 'refer';
    this.showSubscription = false;
  }

  toggleProfessionalDevelopment() {
    this.activeSection = 'professional-development';
    this.showSubscription = false;
  }

  toggleSubscription() {
    this.showSubscription = !this.showSubscription;
    this.activeSection = this.showSubscription ? 'subscription' : 'profile';
  }

  onHeaderStartNow(): void {
    this.showProfile();
  }
}
