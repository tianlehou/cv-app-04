// google-login.component.ts
import { Component, Output, EventEmitter } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { Auth, signInWithPopup, GoogleAuthProvider } from '@angular/fire/auth';
import { FirebaseService } from '../../../../../../shared/services/firebase.service';

@Component({
  selector: 'app-google-login',
  standalone: true,
  imports: [RouterModule],
  template: `
    <button class="google-login-btn" (click)="signInWithGoogle()">
      <i class="fab fa-google"></i>
      Continuar con Google
    </button>
  `,
  styles: [
    `
      .google-login-btn {
        width: 100%;
        padding: 10px 15px;
        background-color: var(--clr-white);
        border: 1px solid var(--clr-green);
        color: var(--clr-green);
        border-radius: 4px;
        font-size: 16px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
        transition: all 0.3s;
      }

      .google-login-btn:hover {
        color: var(--clr-white);
        background-color: var(--clr-green);
        border: 1px solid var(--clr-green);
      }

      .google-login-btn:active {
        transform: scale(0.98);
      }
    `,
  ],
})
export class GoogleLoginComponent {
  @Output() loginSuccess = new EventEmitter<void>();
  @Output() loginError = new EventEmitter<string>();

  constructor(
    private auth: Auth,
    private router: Router,
    private firebaseService: FirebaseService
  ) {}

  async signInWithGoogle() {
    try {
      const result = await signInWithPopup(
        this.auth,
        new GoogleAuthProvider()
      ).catch((error) => {
        if (error.code === 'auth/popup-blocked') {
          this.loginError.emit('Permite ventanas emergentes para este sitio');
        }
        throw error;
      });

      const user = result.user;

      if (!user.email) {
        this.loginError.emit('No se pudo obtener el correo de Google');
        return;
      }

      const userEmailKey = this.firebaseService.formatEmailKey(user.email);
      const existingUser = await this.firebaseService.getUserData(userEmailKey);
      const currentDate = new Date().toISOString();

      if (existingUser) {
        // Actualizar solo lastLogin
        await this.firebaseService.updateUserData(user.email, {
          metadata: {
            ...existingUser.metadata,
            lastLogin: currentDate,
          },
        });
      } else {
        // Crear nuevo usuario con createdAt y lastLogin
        const userData = {
          fullName: user.displayName || 'Usuario Google',
          email: user.email,
          role: 'candidate',
          enabled: true,
          createdAt: currentDate,
          lastLogin: currentDate,
          profileData: {},
        };
        await this.firebaseService.saveUserData(user.email, userData);
      }

      await this.router.navigate(['/candidate']);
      setTimeout(() => {
        window.location.reload();
      }, 100);
      this.loginSuccess.emit();
    } catch (error: any) {
      console.error('Error Google auth:', error);
      this.loginError.emit(
        error.message || 'Error al autenticar con Google. Intenta nuevamente.'
      );
    }
  }
}
