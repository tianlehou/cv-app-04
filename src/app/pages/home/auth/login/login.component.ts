import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../auth.service';
import { FirebaseService } from 'src/app/shared/services/firebase.service';
import { ToastService } from 'src/app/shared/services/toast.service';
import { GoogleLoginComponent } from '../google-login.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    GoogleLoginComponent,
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent {
  loginForm: FormGroup;
  showPassword = false;
  @Output() showRegister = new EventEmitter<void>();
  @Output() showForgotPassword = new EventEmitter<void>();
  @Output() showHome = new EventEmitter<void>();

  constructor(
    private fb: FormBuilder,
    private firebaseService: FirebaseService,
    private authService: AuthService,
    private router: Router,
    private toastService: ToastService
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  goBackToHome() {
    this.showHome.emit();
  }

  onRegisterClick() {
    this.showRegister.emit();
  }

  onForgotPasswordClick() {
    this.showForgotPassword.emit();
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  markFormGroupTouched(formGroup: FormGroup) {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  async login() {
    this.markFormGroupTouched(this.loginForm);

    if (this.loginForm.invalid) {
      this.toastService.show('Por favor completa el formulario correctamente', 'error', 5000);
      return;
    }

    const { email, password } = this.loginForm.value;

    try {
      await this.authService.loginWithEmail(email, password);
      const userData = await this.firebaseService.getCurrentUser();

      if (!userData) throw new Error('No se obtuvieron datos');

      const fullName = userData?.profileData?.personalData?.fullName || 'Usuario';
      const userRole = userData?.metadata?.role || 'candidate';

      await this.firebaseService.updateUserData(email, {
        metadata: { lastLogin: new Date().toISOString() }
      });

      this.toastService.show(`Bienvenido ${fullName}`, 'success', 5000);

      // Redirección basada en el rol del usuario
      let redirectRoute = '/candidate'; // Ruta por defecto

      if (userRole === 'admin') {
        redirectRoute = '/main';
      } else if (userRole === 'business') {
        redirectRoute = '/business';
      }

      this.router.navigateByUrl('/', { skipLocationChange: true }).then(() => {
        this.router.navigate([redirectRoute]);
      });

    } catch (error: any) {
      console.error('Error during login:', error);

      const errorMessages: { [key: string]: string } = {
        'auth/invalid-email': 'Correo inválido',
        'auth/user-disabled': 'Cuenta deshabilitada',
        'auth/user-not-found': 'Usuario no encontrado',
        'auth/wrong-password': 'Contraseña incorrecta',
        'auth/too-many-requests': 'Demasiados intentos. Intenta más tarde',
      };

      const message = errorMessages[error.code] || 'Error al iniciar sesión';
      this.toastService.show(message, 'error', 5000);
    }
  }

  handleGoogleSuccess() {
    this.toastService.show('Autenticación con Google exitosa', 'success', 5000);
    setTimeout(() => {
      this.router.navigate(['/candidate']);
    }, 500);
  }

  handleGoogleError(error: any) {
    this.toastService.show('Error en autenticación con Google', 'error', 5000);
  }
}