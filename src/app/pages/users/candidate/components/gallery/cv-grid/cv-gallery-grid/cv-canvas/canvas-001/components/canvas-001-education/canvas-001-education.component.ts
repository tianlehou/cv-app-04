import { Component, OnInit, Input } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormArray,
  ReactiveFormsModule,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { FirebaseService } from '../../../../../../../../../../../shared/services/firebase.service';
import { User } from '@angular/fire/auth';

@Component({
  selector: 'app-canvas-001-education',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './canvas-001-education.component.html',
  styleUrls: ['./canvas-001-education.component.css'],
})
export class Canvas001EducationComponent implements OnInit {
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
      education: this.fb.array([]),
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
      this.populateEducation(profileData.education || []);
    } catch (error) {
      console.error('Error loading education:', error);
    }
  }

  get educationArray(): FormArray {
    return this.profileForm.get('education') as FormArray;
  }

  private populateEducation(educationList: any[]): void {
    const formArray = this.educationArray;
    formArray.clear();
    educationList.forEach((edu) => {
      const eduGroup = this.fb.group({
        degree: [edu.degree || ''],
        institution: [edu.institution || ''],
        place: [edu.place || ''],
        year: [edu.year || ''],
        achievements: [edu.achievements || ''],
      });
      formArray.push(eduGroup);
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