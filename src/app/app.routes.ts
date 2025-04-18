import { Routes } from '@angular/router';
import { AuthGuard } from './auth.guard';
import { HomeComponent } from './pages/home/home.component';

// Admin Section
import { MainComponent } from './pages/users/admin/main.component';

// Person Section
import { ProfileComponent } from './pages/users/candidate/profile/profile.component';
import { PrincipalComponent } from './pages/users/candidate/principal/principal.component';

// Others Section
import { SubscriptionComponent } from './pages/subscription/subscription.component';

export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'home', component: HomeComponent },

  // Admin Section
  { path: 'main', component: MainComponent, canMatch: [AuthGuard], data: {role: 'admin'}},

  // Person Section
  { path: 'profile', component: ProfileComponent, canMatch: [AuthGuard], data: {role: 'user'}},
  { path: 'principal', component: PrincipalComponent, canMatch: [AuthGuard], data: {role: 'user'}},

  // Others Section
  { path: 'suscripciones', component: SubscriptionComponent },
  { path: '**', redirectTo: 'home' },
];
