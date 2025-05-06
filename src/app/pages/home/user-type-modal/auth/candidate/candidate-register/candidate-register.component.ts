import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { FirebaseService } from '../../../../../../shared/services/firebase.service';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-candidate-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './candidate-register.component.html',
  styleUrls: ['./candidate-register.component.css'],
})
export class CandidateRegisterComponent {
  registerForm: FormGroup;
  showPassword = false; // Controla la visibilidad de la contraseña
  showConfirmPassword = false; // Controla la visibilidad de la confirmación de contraseña
  errorMessage: string | null = null; // Mensaje de error
  successMessage: string | null = null; // Mensaje de éxito
  emailErrorMessage: string | null = null; // Mensaje de error para el correo
  passwordErrorMessage: string | null = null; // Mensaje de error para la contraseña
  confirmPasswordErrorMessage: string | null = null; // Mensaje de error para la confirmación de contraseña
  @Output() showLogin = new EventEmitter<void>();

  constructor(
    private fb: FormBuilder,
    private firebaseService: FirebaseService,
    private router: Router
  ) {
    this.registerForm = this.fb.group({
      fullName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required],
    });
  }

  // Métodos para manejar los clicks
  onLoginClick() {
    this.showLogin.emit();
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPasswordVisibility() {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  register() {
    if (this.registerForm.valid) {
      const { fullName, email, password, confirmPassword } =
        this.registerForm.value;

      // Limpiar mensajes anteriores
      this.successMessage = null;
      this.emailErrorMessage = null;
      this.passwordErrorMessage = null;
      this.confirmPasswordErrorMessage = null;

      // Validar que las contraseñas coincidan
      if (password !== confirmPassword) {
        this.confirmPasswordErrorMessage = 'La contraseña no coincide.';
        return;
      }

      this.firebaseService
        .registerWithEmail(email, password)
        .then((userCredential) => {
          const userData = {
            fullName,
            email,
            role: 'candidate',
            enabled: true,
            createdAt: new Date().toISOString(),
            lastLogin: new Date().toISOString(),
          };

          return this.firebaseService.saveUserData(email, userData);
        })
        .then(() => {
          // Mostrar mensaje de éxito
          this.successMessage = 'Usuario registrado con éxito';

          // Redirigir después de 3 segundos
          setTimeout(() => {
            this.router.navigate(['/login-person']);
          }, 3000);
        })
        .catch((error: { code: string }) => {
          console.error(error);

          // Mapeo de errores de Firebase
          const errorMessages: { [key: string]: string } = {
            'auth/email-already-in-use': '¡Este correo ya está en uso!',
            'auth/invalid-email':
              'Correo inválido. Verifica que esté bien escrito.',
            'auth/weak-password':
              'Contraseña débil. Usa al menos 8 caracteres con letras y números.',
          };

          // Obtener el mensaje de error específico o uno genérico
          const message =
            errorMessages[error.code as keyof typeof errorMessages] ||
            '¡Ocurrió un error inesperado!';

          // Asignar el mensaje de error al campo correspondiente
          if (error.code === 'auth/invalid-email') {
            this.emailErrorMessage = message;
          } else if (error.code === 'auth/weak-password') {
            this.passwordErrorMessage = message;
          } else {
            this.errorMessage = message; // Mensaje genérico para otros errores
          }
        });
    }
  }
}