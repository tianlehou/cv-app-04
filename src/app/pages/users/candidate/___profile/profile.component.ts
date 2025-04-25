import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FirebaseService } from '../../../../shared/services/firebase.service';

// Components
import { CustomButtonComponent } from '../../../../shared/components/buttons/custom-button/custom-button.component';
import { ProfilePictureComponent } from './components/profile-picture/profile-picture.component';
import { PersonalDataComponent } from './components/personal-data/personal-data.component';
import { ExperienceComponent } from './components/experience/experience.component';
import { AboutMeComponent } from './components/about-me/about-me.component';
import { AcademicFormationComponent } from './components/academic-formation/academic-formation.component';
import { LanguagesComponent } from './components/languages/languages.component';
import { SkillsComponent } from './components/skills/skills.component';

// Custom components
import { SidebarComponent } from '../../../../shared/components/buttons/sidebar/sidebar.component';
@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    RouterModule,
    CommonModule,
    CustomButtonComponent,
    SidebarComponent,
    ProfilePictureComponent,
    PersonalDataComponent,
    ExperienceComponent,
    AboutMeComponent,
    AcademicFormationComponent,
    LanguagesComponent,
    SkillsComponent,
  ],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css'],
})
export class ProfileComponent implements OnInit {
  currentUser: any = null; // Usa el tipo correcto según tu aplicación
  userRole: string | null = null;

  constructor(private firebaseService: FirebaseService) {} // Inyecta el servicio

  async ngOnInit(): Promise<void> {
    // Usa el método del servicio para obtener el estado de autenticación
    this.firebaseService.isAuthenticated().subscribe(async (isAuthenticated) => {
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