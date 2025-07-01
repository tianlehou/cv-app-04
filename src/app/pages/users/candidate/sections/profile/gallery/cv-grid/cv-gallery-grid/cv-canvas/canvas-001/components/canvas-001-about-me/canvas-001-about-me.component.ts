import { Component, OnInit, Input } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { FirebaseService } from 'src/app/shared/services/firebase.service';
import { User } from '@angular/fire/auth';

@Component({
  selector: 'app-canvas-001-about-me',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './canvas-001-about-me.component.html',
  styleUrls: ['./canvas-001-about-me.component.css'],
})
export class Canvas001AboutMeComponent implements OnInit {
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
      aboutMe: [''],
    });
  }

  private async loadUserData(): Promise<void> {
    if (!this.userEmail) {
      console.error('Error: Usuario no autenticado.');
      return;
    }

    try {
      const userData = await this.firebaseService.getUserData(this.userEmail);
      const aboutMe = userData?.profileData?.aboutMe || '';

      this.profileForm.patchValue({ aboutMe });
    } catch (error) {
      console.error('Error al cargar los datos del usuario:', error);
      this.profileForm.patchValue({ aboutMe: 'Error al cargar datos' });
    }
  }
}