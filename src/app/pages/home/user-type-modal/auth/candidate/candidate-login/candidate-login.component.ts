import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
  FormControl,
} from '@angular/forms';
import { FirebaseService } from '../../../../../../shared/services/firebase.service';
import { RouterModule, Router } from '@angular/router';
import { GoogleLoginComponent } from '../google-login-button/google-login.component';

@Component({
  selector: 'app-candidate-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    GoogleLoginComponent,
  ],
  templateUrl: './candidate-login.component.html',
  styleUrls: ['./candidate-login.component.css'],
})
export class CandidateLoginComponent {
  loginForm: FormGroup;
  showPassword = false;
  successMessage: string | null = null;
  emailErrorMessage: string | null = null;
  passwordErrorMessage: string | null = null;
  @Output() showRegister = new EventEmitter<void>();
  @Output() showForgotPassword = new EventEmitter<void>();
  @Output() showHome = new EventEmitter<void>();

  constructor(
    private fb: FormBuilder,
    private firebaseService: FirebaseService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });

    // Escuchar cambios en los campos para limpiar mensajes de error
    this.loginForm.get('email')?.valueChanges.subscribe(() => {
      this.emailErrorMessage = null;
    });
    this.loginForm.get('password')?.valueChanges.subscribe(() => {
      this.passwordErrorMessage = null;
    });
  }

  // método de regreso a #home
  goBackToHome() {
    this.showHome.emit();
  }

  // Método para manejar el click en "Registrarse"
  onRegisterClick() {
    this.showRegister.emit();
  }

  // Método para manejar el click en "Olvidé mi contraseña"
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

  login() {
    // Marcar todos los campos como touched para mostrar errores de validación
    this.markFormGroupTouched(this.loginForm);

    const { email, password } = this.loginForm.value;

    // Limpiar mensajes anteriores
    this.successMessage = null;
    this.emailErrorMessage = null;
    this.passwordErrorMessage = null;

    if (this.loginForm.valid) {
      this.firebaseService
        .loginWithEmail(email, password)
        .then((user) => {
          // Actualizar lastLogin en la ubicación de metadatos
          this.firebaseService.updateUserData(user.email, {
            lastLogin: new Date().toISOString(),
          });

          this.successMessage = 'Inicio de sesión exitoso';
          setTimeout(() => {
            if (user?.role === 'admin') {
              this.router.navigate(['/main']);
            } else {
              this.router.navigate(['/candidate']);
            }
          }, 3000);
        })
        .catch((error: { code: string }) => {
          console.error(error);

          const errorMessages: { [key: string]: string } = {
            'auth/invalid-email': 'Correo inválido. Verifica que esté bien escrito.',
            'auth/user-disabled': 'Tu cuenta ha sido deshabilitada.',
            'auth/user-not-found': 'No se encontró una cuenta con este correo.',
            'auth/wrong-password': 'Contraseña incorrecta.',
            'auth/too-many-requests': 'Demasiados intentos fallidos. Intenta más tarde o restablece tu contraseña.',
          };

          const message = errorMessages[error.code] || 'Ocurrió un error durante el inicio de sesión.';

          if (error.code === 'auth/wrong-password') {
            this.passwordErrorMessage = message;
          } else {
            this.emailErrorMessage = message;
          }
        });
    }
  }

  handleGoogleSuccess() {
    this.successMessage = 'Autenticación con Google exitosa';
    setTimeout(() => {
      this.router.navigate(['/candidate']);
    }, 2000);
  }

  handleGoogleError(message: string) {
    this.emailErrorMessage = message;
  }
}