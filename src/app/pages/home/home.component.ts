import { Component, ViewChild, ChangeDetectorRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { ReferralService } from '../users/candidate/components/sidebar/refer/referral.service';

import { UserTypeModalComponent } from './user-type-modal/user-type-modal.component';
import { HeroComponent } from './components/hero/hero.component';
import { FeaturesComponent } from './components/features/features.component';
import { CallToActionComponent } from './components/call-to-action/call-to-action.component';
import { TestimonialsComponent } from './components/testimonials/testimonials.component';
import { FooterComponent } from './components/footer/footer.component';
import { CandidateLoginComponent } from './user-type-modal/auth/candidate/candidate-login/candidate-login.component';
import { CandidateRegisterComponent } from './user-type-modal/auth/candidate/candidate-register/candidate-register.component';
import { CandidateForgotPasswordComponent } from './user-type-modal/auth/candidate/candidate-forgot-password/candidate-forgot-password.component';
import { BusinessLoginComponent } from './user-type-modal/auth/business/business-login/business-login.component';
import { BusinessRegisterComponent } from './user-type-modal/auth/business/business-register/business-register.component';
import { BusinessForgotPasswordComponent } from './user-type-modal/auth/business/business-forgot-password/business-forgot-password.component';

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

    BusinessLoginComponent,
    BusinessRegisterComponent,
    BusinessForgotPasswordComponent,

  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit {
  showHomeSection = true;
  showCandidateSection = false;
  showBusinessSection = false;
  currentCandidateView: 'login' | 'register' | 'forgot-password' = 'login';
  currentBusinessView: 'business-login' | 'business-register' | 'business-forgot-password' = 'business-login';

  @ViewChild(UserTypeModalComponent) userTypeModal!: UserTypeModalComponent;

  constructor(
    private cd: ChangeDetectorRef,
    private route: ActivatedRoute,
    private referralService: ReferralService,
  ) { }

  ngOnInit() {
    this.route.queryParamMap.subscribe(params => {
      const ref = params.get('ref');
      const view = params.get('view');

      if (ref) {
        this.referralService.setReferralId(ref);
      }

      // Mostrar directamente la sección de registro si viene con view=register
      if (view === 'register') {
        this.showHomeSection = false;
        this.showCandidateSection = true;
        this.currentCandidateView = 'register';
        this.cd.detectChanges();

        // Si no hay ref pero sí view=register, igual mostrar el registro
      } else if (this.referralService.getStoredReferralId()) {
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

  onUserTypeSelected(type: 'candidate' | 'business') {
    if (type === 'candidate') {
      this.showHomeSection = false;
      this.showCandidateSection = true;
      this.currentCandidateView = 'login';
    } else if (type === 'business') {
      this.showHomeSection = false;
      this.showBusinessSection = true;
      this.currentBusinessView = 'business-login';
    }
    this.cd.detectChanges();
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

  showBusinessLogin() {
    this.currentBusinessView = 'business-login';
  }

  showBusinessRegister() {
    this.currentBusinessView = 'business-register';
  }

  showBusinessForgotPassword() {
    this.currentBusinessView = 'business-forgot-password';
  }
}