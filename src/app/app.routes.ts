import { Routes } from '@angular/router';
import { AuthGuard } from './auth.guard';
import { HomeComponent } from './pages/home/home.component';

// Admin Section
import { MainComponent } from './pages/users/admin/main.component';

// Business Section
import { BusinessComponent } from './pages/users/business/business.component';

// Candidate Section
import { CandidateComponent } from './pages/users/candidate/candidate.component';

export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'home', component: HomeComponent },

  // Admin Section
  { path: 'main', component: MainComponent, canMatch: [AuthGuard], data: { role: 'admin' } },

  // Business Section
  { path: 'business', component: BusinessComponent, canMatch: [AuthGuard], data: { role: 'business' } },

  // Candidate Section
  { path: 'candidate', component: CandidateComponent, canMatch: [AuthGuard], data: { role: 'candidate' } },

  // Others Section
  { path: '**', redirectTo: 'home' },
];
