import { Component, ChangeDetectorRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { ReferralService } from '../users/candidate/sections/refer/referral.service';

import { HeaderComponent } from './components/header/header.component';
import { HeroComponent } from './components/hero/hero.component';
// import { FeaturesComponent } from './components/features/features.component';

import { LandingCandidateComponent } from './landing-candidate/landing-candidate.component';
import { LandingBusinessComponent } from './landing-business/landing-business.component';
import { FooterComponent } from './components/footer/footer.component';

import { LoginComponent } from './auth/login/login.component';
import { RegisterComponent } from './auth/register/register.component';
import { ForgotPasswordComponent } from './auth/forgot-password/forgot-password.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    HeaderComponent,
    HeroComponent,
    LandingCandidateComponent,
    LandingBusinessComponent,
    // FeaturesComponent,
    FooterComponent,
    LoginComponent,
    RegisterComponent,
    ForgotPasswordComponent,
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit {
  showHomeSection = true;
  showAuthSection = false;
  currentHomeView: 'candidate' | 'business' = 'candidate';
  currentAuthView: 'login' | 'register' | 'forgot-password' = 'login';

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
        this.showAuthSection = true;
        this.currentAuthView = 'register';
        this.cd.detectChanges();

        // Si no hay ref pero sí view=register, igual mostrar el registro
      } else if (this.referralService.getStoredReferralId()) {
        // Si hay un referral almacenado pero no viene en la URL (por ejemplo, al recargar)
        this.showHomeSection = false;
        this.showAuthSection = true;
        this.currentAuthView = 'register';
        this.cd.detectChanges();
      }
    });
  }

  // Nuevos métodos para cambiar vista
  showBusiness() {
    this.currentHomeView = 'business';
    this.cd.detectChanges();
  }

  showCandidate() {
    this.currentHomeView = 'candidate';
    this.cd.detectChanges();
  }

  showHomeBusiness() {
    this.showHomeSection = true;
    this.showAuthSection = false;
    this.currentHomeView = 'business';
    this.cd.detectChanges();
  }

  showLogin() {
    this.currentAuthView = 'login';
  }

  showAuthLogin() {
    this.showHomeSection = false;
    this.showAuthSection = true;
    this.currentAuthView = 'login';
    this.cd.detectChanges();
  }

  showRegister() {
    this.currentAuthView = 'register';
  }

  showAuthRegister() {
    this.showHomeSection = false;
    this.showAuthSection = true;
    this.currentAuthView = 'register';
    this.cd.detectChanges();
  }

  showForgotPassword() {
    this.currentAuthView = 'forgot-password';
  }
}