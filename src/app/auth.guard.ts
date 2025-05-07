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
      const user = await firstValueFrom(authState(this.auth));
      if (!user || !user.email) {
        this.router.navigate(['/home']); // Redirigir a home en lugar de login-person
        return false;
      }
  
      const emailKey = user.email.replace(/\./g, '_');
      const snapshot = await runInInjectionContext(this.injectionContext, 
        () => get(ref(this.db, `cv-app/users/${emailKey}/metadata`))); // Cambiar la ruta a metadata
  
      if (!snapshot.exists()) {
        this.router.navigate(['/home']);
        return false;
      }
  
      const userRole = snapshot.val().role;
      const requiredRole = route.data?.['role'];
      
      if (userRole === requiredRole) {
        return true;
      } else {
        this.router.navigate([userRole === 'admin' ? '/main' : '/candidate']);
        return false;
      }
    });
  }
}