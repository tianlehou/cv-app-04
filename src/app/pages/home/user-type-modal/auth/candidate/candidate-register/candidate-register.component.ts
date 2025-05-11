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
  @Output() showLogin = new EventEmitter<void>();

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private firebaseService: FirebaseService,
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
    this.firebaseService.currentReferral.subscribe((ref) => {
      this.referredBy = ref;
      this.registerForm.patchValue({ referredBy: ref });
    });
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
      const { fullName, email, password, confirmPassword, referredBy } =
        this.registerForm.value;

      if (password !== confirmPassword) {
        this.toastService.show('Las contraseñas no coinciden', 'error', 5000);
        return;
      }

      try {
        // 1. Registrar usuario en Firebase Auth
        const userCredential = await this.authService.registerWithEmail(
          email,
          password
        );

        // Pequeña pausa para asegurar propagación
        await new Promise((resolve) => setTimeout(resolve, 300));

        // 2. Inicializar toda la estructura del usuario de una vez
        await this.firebaseService.initializeUserData(email, {
          profileData: {
            personalData: {
              fullName: fullName,
            },
          },
          metadata: {
            email: email,
            role: 'candidate',
            enabled: true,
            createdAt: new Date().toISOString(),
            ...(referredBy && { referredBy }),
          },
        });

        // Mensaje de éxito
        const successMessage = referredBy
          ? `¡Registro exitoso! Has sido referido por ${referredBy}`
          : 'Usuario registrado con éxito';

        this.toastService.show(successMessage, 'success', 5000);
        this.firebaseService.clearReferralId();

        setTimeout(() => this.showLogin.emit(), 500);
      } catch (error: any) {
        console.error('Error completo:', error);
        this.toastService.show(
          'Error al registrar: ' + (error.message || 'Desconocido'),
          'error',
          5000
        );
      }
    } else {
      this.toastService.show(
        'Por favor completa todos los campos requeridos correctamente',
        'error',
        5000
      );
    }
  }
}
