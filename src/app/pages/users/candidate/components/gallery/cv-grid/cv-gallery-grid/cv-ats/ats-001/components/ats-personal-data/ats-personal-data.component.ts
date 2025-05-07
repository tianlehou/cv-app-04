import { Component, OnInit, Input } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { FirebaseService } from '../../../../../../../../../../../shared/services/firebase.service';
import { User } from '@angular/fire/auth';

@Component({
  selector: 'app-ats-personal-data',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './ats-personal-data.component.html',
  styleUrls: ['./ats-personal-data.component.css'],
})
export class AtsPersonalDataComponent implements OnInit {
  @Input() currentUser: User | null = null;
  profileForm!: FormGroup;
  userEmail: string | null = null;

  constructor(
    private fb: FormBuilder,
    private firebaseService: FirebaseService
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    if (this.currentUser) {
      this.userEmail = this.currentUser.email?.replace(/\./g, '_') || null;
      this.loadUserData();
    }
  }

  private initializeForm(): void {
    this.profileForm = this.fb.group({
      fullName: ['No especificado'],
      profesion: ['No especificado'],
      phone: ['No especificado'],
      editableEmail: ['No especificado'],
      direction: ['No especificado'],
    });
  }

  private async loadUserData(): Promise<void> {
    if (!this.userEmail) {
      console.error('Error: Usuario no autenticado.');
      return;
    }

    try {
      const userData = await this.firebaseService.getUserData(this.userEmail);
      this.profileForm.patchValue({
        fullName: userData?.profileData?.personalData?.fullName || 'No especificado',
        profesion: userData?.profileData?.personalData?.profesion || 'No especificado',
        phone: userData?.profileData?.personalData?.phone || 'No especificado',
        editableEmail: userData?.profileData?.personalData?.editableEmail || 'No especificado',
        direction: userData?.profileData?.personalData?.direction || 'No especificado',
      });
    } catch (error) {
      console.error('Error al cargar datos personales:', error);
    }
  }
}