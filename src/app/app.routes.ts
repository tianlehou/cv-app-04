import { Routes } from '@angular/router';
import { AuthGuard } from './auth.guard';
import { HomeComponent } from './pages/home/home.component';

// Admin Section
import { MainComponent } from './pages/users/admin/main.component';

// Person Section
import { CandidateComponent } from './pages/users/candidate/candidate.component';

// Others Section
import { SubscriptionComponent } from './pages/subscription/subscription.component';

export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'home', component: HomeComponent },

  // Admin Section
  { path: 'main', component: MainComponent, canMatch: [AuthGuard], data: {role: 'admin'}},

  // Person Section
  { path: 'candidate', component: CandidateComponent, canMatch: [AuthGuard], data: {role: 'candidate'}},

  // Others Section
  { path: 'suscripciones', component: SubscriptionComponent },
  { path: '**', redirectTo: 'home' },
];
