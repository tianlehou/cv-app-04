import { Component, OnInit, Input } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { FirebaseService } from '../../../../../../../../../../../shared/services/firebase.service';
import { User } from '@angular/fire/auth';

@Component({
  selector: 'app-ats-about-me',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './ats-about-me.component.html',
  styleUrls: ['./ats-about-me.component.css'],
})
export class AtsAboutMeComponent implements OnInit {
  @Input() currentUser: User | null = null;
  profileForm!: FormGroup;
  userEmail: string | null = null;
  isLoading = true;

  constructor(
    private fb: FormBuilder,
    private firebaseService: FirebaseService
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    if (this.currentUser) {
      this.userEmail = this.currentUser.email?.replace(/\./g, '_') || null;
      this.loadUserData();
    } else {
      this.isLoading = false;
    }
  }

  private initializeForm(): void {
    this.profileForm = this.fb.group({
      aboutMe: ['No especificado'],
    });
  }

  private async loadUserData(): Promise<void> {
    if (!this.userEmail) {
      console.error('Error: Usuario no autenticado.');
      this.isLoading = false;
      return;
    }

    try {
      const userData = await this.firebaseService.getUserData(this.userEmail);
      const aboutMe = userData?.profileData?.aboutMe || 'No especificado';

      this.profileForm.patchValue({ aboutMe });
    } catch (error) {
      console.error('Error al cargar los datos del usuario:', error);
      this.profileForm.patchValue({ aboutMe: 'Error al cargar datos' });
    } finally {
      this.isLoading = false;
    }
  }
}