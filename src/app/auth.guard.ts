import { Injectable, inject, NgZone, runInInjectionContext, EnvironmentInjector } from '@angular/core';
import { CanMatch, Route, Router } from '@angular/router';
import { Auth } from '@angular/fire/auth';
import { Database, ref, get } from '@angular/fire/database';
import { firstValueFrom } from 'rxjs';
import { authState } from 'rxfire/auth';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanMatch {
  private auth = inject(Auth);
  private db = inject(Database);
  private router = inject(Router);
  private ngZone = inject(NgZone);
  private injectionContext = inject(EnvironmentInjector);

  async canMatch(route: Route): Promise<boolean> {
    return this.ngZone.run(async () => {
      // Check authentication state
      const user = await firstValueFrom(authState(this.auth));
      if (!user || !user.email) {
        return this.redirect();
      }

      // Prepare database key
      const emailKey = user.email.replace(/\./g, '_');

      // Fetch user data from database
      const snapshot = await runInInjectionContext(this.injectionContext, () => get(ref(this.db, `cv-app/users/${emailKey}`)));

      // Check role and decide
      return snapshot.exists() && snapshot.val().role === route.data?.['role']
        ? true
        : this.redirect();
    });
  }

  private redirect(): boolean {
    this.router.navigate(['/login-person']);
    return false;
  }
}