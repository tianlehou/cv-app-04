import { Component, Output, EventEmitter } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FirebaseService } from '../../../../../../shared/services/firebase.service';
import { AuthService } from '../../auth.service';

@Component({
  selector: 'app-candidate-forgot-password',
  standalone: true, // Indica que el componente es standalone
  imports: [CommonModule, ReactiveFormsModule, RouterModule], // Importa los módulos necesarios
  templateUrl: './candidate-forgot-password.component.html',
  styleUrls: ['./candidate-forgot-password.component.css'],
})
export class CandidateForgotPasswordComponent {
  forgotPasswordForm: FormGroup;
  @Output() showLogin = new EventEmitter<void>();

  constructor(private fb: FormBuilder, private firebaseService: FirebaseService, private authService: AuthService) {
    this.forgotPasswordForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
    });
  }

  // Métodos para manejar los clicks
  onLoginClick() {
    this.showLogin.emit();
  }

  recoverPassword() {
    const email = this.forgotPasswordForm.get('email')?.value;
    if (email) {
      this.authService
        .sendPasswordResetEmail(email)
        .then(() => {
          alert('Enlace de recuperación enviado. Revisa tu correo.');
        })
        .catch((error) => {
          alert('Error al enviar el enlace de recuperación: ' + error.message);
        });
    }
  }
}
