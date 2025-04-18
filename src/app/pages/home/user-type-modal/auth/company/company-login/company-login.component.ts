import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { FirebaseService } from '../../../shared/services/firebase.service';
import { RouterModule, Router } from '@angular/router';

@Component({
  selector: 'app-company-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './company-login.component.html',
  styleUrls: ['./company-login.component.css'],
})
export class CompanyLoginComponent {
  loginForm: FormGroup;
  showPassword = false;
  successMessage: string | null = null; // Mensaje de éxito
  emailErrorMessage: string | null = null; // Mensaje de error para el correo
  passwordErrorMessage: string | null = null; // Mensaje de error para la contraseña

  constructor(
    private fb: FormBuilder,
    private firebaseService: FirebaseService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  login() {
    const { email, password } = this.loginForm.value;

    // Limpiar mensajes anteriores
    this.successMessage = null;
    this.emailErrorMessage = null;
    this.passwordErrorMessage = null;

    if (this.loginForm.valid) {
      this.firebaseService
        .loginWithEmail(email, password)
        .then((user) => {
          // Actualizar último acceso
          this.firebaseService.updateUserData(user.email, {
            lastLogin: new Date().toISOString(),
          });

          this.successMessage = 'Inicio de sesión exitoso';
          setTimeout(() => {
            if (user?.role === 'admin') {
              this.router.navigate(['/main']);
            } else {
              this.router.navigate(['/profile']);
            }
          }, 3000);
        })
        .catch((error: { code: string }) => {
          console.error(error);

          // Mapeo de errores de Firebase
          const errorMessages: { [key: string]: string } = {
            'auth/invalid-email':
              'Correo inválido. Verifica que esté bien escrito.',
            'auth/user-disabled': 'Tu cuenta ha sido deshabilitada.',
            'auth/user-not-found': 'No se encontró una cuenta con este correo.',
            'auth/wrong-password': 'Contraseña incorrecta.',
          };

          // Obtener el mensaje de error específico o uno genérico
          const message =
            errorMessages[error.code as keyof typeof errorMessages] ||
            '¡Ocurrió un error inesperado!';

          // Asignar el mensaje de error al campo correspondiente
          if (
            error.code === 'auth/invalid-email' ||
            error.code === 'auth/user-not-found'
          ) {
            this.emailErrorMessage = message;
          } else if (error.code === 'auth/wrong-password') {
            this.passwordErrorMessage = message;
          } else {
            this.emailErrorMessage = message; // Mensaje genérico para otros errores
          }
        });
    }
  }
}
