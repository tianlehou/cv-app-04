import { Component, ViewChild, ChangeDetectorRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { UserTypeModalComponent } from './user-type-modal/user-type-modal.component';
import { FirebaseService } from '../../shared/services/firebase.service';

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
export class HomeComponent implements OnInit {
  showHomeSection = true;
  showCandidateSection = false;
  currentCandidateView: 'login' | 'register' | 'forgot-password' = 'login';

  @ViewChild(UserTypeModalComponent) userTypeModal!: UserTypeModalComponent;

  constructor(
    private cd: ChangeDetectorRef,
    private route: ActivatedRoute,
    private firebaseService: FirebaseService,
  ) { }

ngOnInit() {
    this.route.queryParamMap.subscribe(params => {
      const ref = params.get('ref');
      const view = params.get('view');
      
      if (ref) {
        this.firebaseService.setReferralId(ref);
      }

      // Mostrar directamente la sección de registro si viene con view=register
      if (view === 'register') {
        this.showHomeSection = false;
        this.showCandidateSection = true;
        this.currentCandidateView = 'register';
        this.cd.detectChanges();
        
        // Si no hay ref pero sí view=register, igual mostrar el registro
      } else if (this.firebaseService.getStoredReferralId()) {
        // Si hay un referral almacenado pero no viene en la URL (por ejemplo, al recargar)
        this.showHomeSection = false;
        this.showCandidateSection = true;
        this.currentCandidateView = 'register';
        this.cd.detectChanges();
      }
    });
  }

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