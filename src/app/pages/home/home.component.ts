import { Component, ViewChild, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserTypeModalComponent } from './user-type-modal/user-type-modal.component';

import { HeroComponent } from './components/hero/hero.component';
import { FeaturesComponent } from './components/features/features.component';
import { CallToActionComponent } from './components/call-to-action/call-to-action.component';
import { TestimonialsComponent } from './components/testimonials/testimonials.component';
import { FooterComponent } from './components/footer/footer.component';
import { CandidateLoginComponent } from './user-type-modal/auth/candidate/candidate-login/candidate-login.component';
import { CandidateRegisterComponent } from './user-type-modal/auth/candidate/candidate-register/candidate-register.component';
import { CandidateForgotPasswordComponent } from './user-type-modal/auth/candidate/candidate-forgot-password/candidate-forgot-password.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    UserTypeModalComponent,
    HeroComponent,
    FeaturesComponent,
    CallToActionComponent,
    TestimonialsComponent,
    FooterComponent,
    CandidateLoginComponent,
    CandidateRegisterComponent,
    CandidateForgotPasswordComponent,
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent {
  showHomeSection = true;
  showCandidateSection = false;
  currentCandidateView: 'login' | 'register' | 'forgot-password' = 'login';

  @ViewChild(UserTypeModalComponent) userTypeModal!: UserTypeModalComponent;
  constructor(private cd: ChangeDetectorRef) { }

  openUserTypeModal() {
    this.userTypeModal.openModal();
  }

  onUserTypeSelected(type: 'candidate' | 'company') {
    if (type === 'candidate') {
      this.showHomeSection = false;
      this.showCandidateSection = true;
      this.currentCandidateView = 'login';
      this.cd.detectChanges();
    }
  }

  // Nuevos métodos para cambiar vistas
  showLogin() {
    this.currentCandidateView = 'login';
  }

  showRegister() {
    this.currentCandidateView = 'register';
  }

  showForgotPassword() {
    this.currentCandidateView = 'forgot-password';
  }
}