import { Component, OnInit, Input } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { FirebaseService } from '../../../../../../../../../../shared/services/firebase.service';
import { User } from '@angular/fire/auth';

@Component({
  selector: 'app-ats-experience',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './ats-experience.component.html',
  styleUrls: ['./ats-experience.component.css'],
})
export class AtsExperienceComponent implements OnInit {
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
      const experiences = userData?.profileData?.experience || [];
      this.populateExperiences(experiences);
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
    
    if (experiences.length === 0) {
      formArray.push(this.fb.group({
        year: ['No especificado'],
        company: ['No especificado'],
        role: ['No especificado'],
        description: ['No especificado'],
      }));
    } else {
      experiences.forEach(exp => {
        formArray.push(this.fb.group({
          year: [exp.year || 'No especificado'],
          company: [exp.company || 'No especificado'],
          role: [exp.role || 'No especificado'],
          description: [exp.description || 'No especificado'],
        }));
      });
    }
  }
}