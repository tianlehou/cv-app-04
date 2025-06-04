// auth.service.ts
import { Injectable, inject, runInInjectionContext, EnvironmentInjector } from '@angular/core';
import { Auth, createUserWithEmailAndPassword, onAuthStateChanged, sendPasswordResetEmail, signInWithEmailAndPassword } from '@angular/fire/auth';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private auth = inject(Auth);
  private injector = inject(EnvironmentInjector);
  private authState = new BehaviorSubject<boolean>(false);

  constructor() {
    this.monitorAuthState();
  }

  private monitorAuthState() {
    runInInjectionContext(this.injector, () => {
      onAuthStateChanged(this.auth, (user) => {
        this.authState.next(!!user);
      });
    });
  }

  isAuthenticated(): Observable<boolean> {
    return this.authState.asObservable();
  }

  registerWithEmail(email: string, password: string) {
    return runInInjectionContext(this.injector, () =>
      createUserWithEmailAndPassword(this.auth, email, password)
    );
  }

  async loginWithEmail(email: string, password: string) {
    return runInInjectionContext(this.injector, async () => {
      return await signInWithEmailAndPassword(this.auth, email, password);
    });
  }

  sendPasswordResetEmail(email: string) {
    return runInInjectionContext(this.injector, () =>
      sendPasswordResetEmail(this.auth, email)
    );
  }

  logout() {
    runInInjectionContext(this.injector, () => this.auth.signOut());
  }

  getCurrentAuthUser() {
    return this.auth.currentUser;
  }
}