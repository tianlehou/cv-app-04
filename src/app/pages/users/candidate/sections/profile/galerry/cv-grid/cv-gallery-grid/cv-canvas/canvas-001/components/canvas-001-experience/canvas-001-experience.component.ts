import { Component, OnInit, Input } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormArray,
  ReactiveFormsModule,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { FirebaseService } from 'src/app/shared/services/firebase.service';
import { User } from '@angular/fire/auth';

@Component({
  selector: 'app-canvas-001-experience',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './canvas-001-experience.component.html',
  styleUrls: ['./canvas-001-experience.component.css'],
})
export class Canvas001ExperienceComponent implements OnInit {
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
      experience: this.fb.array([]),
    });
  }

  private async loadUserData(): Promise<void> {
    if (!this.userEmail) {
      console.error('Error: Usuario no autenticado.');
      return;
    }

    try {
      const userData = await this.firebaseService.getUserData(this.userEmail);
      const profileData = userData?.profileData || {};
      this.populateExperiences(profileData.experience || []);
    } catch (error) {
      console.error('Error loading experiences:', error);
    }
  }

  get experienceArray(): FormArray {
    return this.profileForm.get('experience') as FormArray;
  }

  private populateExperiences(experiences: any[]): void {
    const formArray = this.experienceArray;
    formArray.clear();
    experiences.forEach((exp) => {
      const expGroup = this.fb.group({
        role: [exp.role || ''],
        company: [exp.company || ''],
        place: [exp.place || ''],
        year: [exp.year || ''],
        description: [exp.description || ''],
      });
      formArray.push(expGroup);
    });
  }

  formatDescription(description: string): string {
    if (!description) return 'No especificado';

    // Dividir por saltos de línea y agregar viñetas
    return description
      .split('\n')
      .filter((line) => line.trim() !== '') // Filtrar líneas vacías
      .map((line) => `• ${line.trim()}`) // Agregar viñeta a cada línea
      .join('\n'); // Unir nuevamente con saltos de línea
  }
}
