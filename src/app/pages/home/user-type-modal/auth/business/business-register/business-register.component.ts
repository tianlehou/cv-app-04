import { Component, EventEmitter, Output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { FirebaseService } from 'src/app/shared/services/firebase.service';
import { AuthService } from '../../auth.service';
import { ToastService } from '../../../../../../shared/services/toast.service';

@Component({
  selector: 'app-business-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './business-register.component.html',
  styleUrls: ['./business-register.component.css'],
})
export class BusinessRegisterComponent implements OnInit {
  @Output() showBusinessLogin = new EventEmitter<void>();
  registerForm: FormGroup;
  showPassword = false;
  showConfirmPassword = false;
  isLoading = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private firebaseService: FirebaseService,
    private router: Router,
    private toastService: ToastService
  ) {
    this.registerForm = this.fb.group({
      fullName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required],
    });
  }

  ngOnInit() {}

  onLoginClick() {
    this.showBusinessLogin.emit();
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPasswordVisibility() {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  async register() {
    if (this.registerForm.valid) {
      this.isLoading = true;
      const { fullName, email, password, confirmPassword } = this.registerForm.value;

      // Validar coincidencia de contraseñas
      if (password !== confirmPassword) {
        this.toastService.show('Las contraseñas no coinciden', 'error', 5000);
        this.isLoading = false;
        return;
      }

      try {
        // 1. Registrar usuario en Firebase Auth
        const userCredential = await this.authService.registerWithEmail(email, password);

        // Pequeña pausa para asegurar propagación
        await new Promise((resolve) => setTimeout(resolve, 800));

        // 2. Inicializar datos del usuario en Realtime Database
        await this.firebaseService.initializeUserData(email, {
          profileData: {
            personalData: {
              fullName: fullName,
            },
          },
          metadata: {
            email: email,
            role: 'business',
            enabled: true,
            createdAt: new Date().toISOString(),
            userId: this.firebaseService.generateUserId(),
          },
        });

        // Mensaje de éxito
        this.toastService.show('Empresa registrada con éxito', 'success', 5000);

        // Redirigir a login
        setTimeout(() => this.showBusinessLogin.emit(), 800);
      } catch (error: any) {
        console.error('Error durante el registro:', error);
        
        // Mensajes de error más específicos
        const errorMessage = this.getFriendlyErrorMessage(error);
        this.toastService.show(errorMessage, 'error', 5000);
      } finally {
        this.isLoading = false;
      }
    } else {
      this.toastService.show(
        'Por favor completa todos los campos requeridos correctamente',
        'error',
        5000
      );
    }
  }

  private getFriendlyErrorMessage(error: any): string {
    if (error.code) {
      switch (error.code) {
        case 'auth/email-already-in-use':
          return 'El correo electrónico ya está registrado';
        case 'auth/weak-password':
          return 'La contraseña debe tener al menos 8 caracteres';
        case 'auth/invalid-email':
          return 'El correo electrónico no es válido';
        default:
          return `Error al registrar: ${error.message || 'Error desconocido'}`;
      }
    }
    return `Error al registrar: ${error.message || 'Error desconocido'}`;
  }
}