import { Component, EventEmitter, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FirebaseService } from 'src/app/shared/services/firebase.service';
import { AuthService } from '../../auth.service';

@Component({
  selector: 'app-business-forgot-password',
  standalone: true, // Indica que el componente es standalone
  imports: [CommonModule, ReactiveFormsModule, RouterModule], // Importa los módulos necesarios
  templateUrl: './business-forgot-password.component.html',
  styleUrls: ['./business-forgot-password.component.css'],
})
export class BusinessForgotPasswordComponent {
  @Output() showBusinessLogin = new EventEmitter<void>();
  forgotPasswordForm: FormGroup;

  constructor(private fb: FormBuilder, private firebaseService: FirebaseService, private authService: AuthService) {
    this.forgotPasswordForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
    });
  }

  onLoginClick() {
    this.showBusinessLogin.emit();
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
