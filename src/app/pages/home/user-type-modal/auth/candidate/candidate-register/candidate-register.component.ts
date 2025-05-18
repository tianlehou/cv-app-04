import { Component, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { AuthService } from '../../auth.service';
import { FirebaseService } from '../../../../../../shared/services/firebase.service';
import { ReferralService } from 'src/app/pages/users/candidate/components/sidebar/refer/referral.service';
import { ToastService } from '../../../../../../shared/services/toast.service';

@Component({
  selector: 'app-candidate-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './candidate-register.component.html',
  styleUrls: ['./candidate-register.component.css'],
})
export class CandidateRegisterComponent implements OnInit {
  registerForm: FormGroup;
  showPassword = false;
  showConfirmPassword = false;
  referredBy: string | null = null;
  isLoading = false;
  @Output() showLogin = new EventEmitter<void>();

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private firebaseService: FirebaseService,
    private referralService: ReferralService,
    public toastService: ToastService
  ) {
    this.registerForm = this.fb.group({
      fullName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required],
      referredBy: [''],
    });
  }

  ngOnInit() {
    // Cargar referralId desde localStorage si existe
    const storedReferralId = this.referralService.getStoredReferralId();
    if (storedReferralId) {
      this.referredBy = storedReferralId;
      this.registerForm.patchValue({ referredBy: storedReferralId });
    } else {
      // O suscribirse al observable si no hay en localStorage
      this.referralService.currentReferral.subscribe((ref) => {
        if (ref) {
          this.referredBy = ref;
          this.registerForm.patchValue({ referredBy: ref });
        }
      });
    }
  }

  onLoginClick() {
    this.showLogin.emit();
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
      const { fullName, email, password, confirmPassword, referredBy } =
        this.registerForm.value;

      // Validar coincidencia de contraseñas
      if (password !== confirmPassword) {
        this.toastService.show('Las contraseñas no coinciden', 'error', 5000);
        this.isLoading = false;
        return;
      }

      try {
        // 1. Registrar usuario en Firebase Auth
        const userCredential = await this.authService.registerWithEmail(
          email,
          password
        );

        // Pequeña pausa para asegurar propagación
        await new Promise((resolve) => setTimeout(resolve, 800));

        // Generar userId temprano para usarlo en todo el proceso
        const userId = this.firebaseService.generateUserId();

        // 2. Inicializar datos del usuario en Realtime Database
        await this.firebaseService.initializeUserData(email, {
          profileData: {
            personalData: {
              fullName: fullName,
            },
          },
          metadata: {
            createdAt: new Date().toISOString(),
            email: email,
            enabled: true,
            ...(referredBy && { referredBy: this.firebaseService.formatEmailKey(referredBy) }),
            role: 'candidate',
            userId: userId,
            subscriptionStatus: 0.00, // Estado inicial de suscripción
          },
        });

        // Esperar un poco más para asegurar indexación
        await new Promise((resolve) => setTimeout(resolve, 500));

        // 3. Procesar referido si existe
        if (referredBy) {
          try {
            await this.referralService.addReferral(
              referredBy,
              this.registerForm.value.fullName,
              email
            );
            console.log('Referencia procesada exitosamente');
          } catch (referralError) {
            console.error('Error procesando referencia:', referralError);
            // No bloquear el registro si falla la referencia
            this.toastService.show(
              'Registro exitoso, pero hubo un error registrando la referencia',
              'warning',
              5000
            );
          }
        }

        // Mensaje de éxito y limpieza
        const successMessage = referredBy
          ? '¡Registro exitoso! Has sido referido correctamente'
          : 'Usuario registrado con éxito';
        this.toastService.show(successMessage, 'success', 5000);
        this.referralService.clearReferralId();

        // Redirigir a login
        setTimeout(() => this.showLogin.emit(), 800);
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
          return 'La contraseña debe tener al menos 6 caracteres';
        case 'auth/invalid-email':
          return 'El correo electrónico no es válido';
        default:
          return `Error al registrar: ${error.message || 'Error desconocido'}`;
      }
    }
    return `Error al registrar: ${error.message || 'Error desconocido'}`;
  }
}