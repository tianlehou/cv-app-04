import { Component, OnInit, Input } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { FirebaseService } from '../../../../../../shared/services/firebase.service';
import { User } from '@angular/fire/auth';

@Component({
  selector: 'app-experience',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './experience.component.html',
  styleUrls: ['./experience.component.css'],
})
export class ExperienceComponent implements OnInit {
  @Input() currentUser: User | null = null;
  profileForm!: FormGroup;
  userEmail: string | null = null;
  editableFields: { [key: string]: boolean } = {};
  isDeleteModalVisible = false;
  experienceIndexToDelete: number | null = null;

  constructor(
    private fb: FormBuilder,
    private firebaseService: FirebaseService
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    if (this.currentUser) {
      this.userEmail = this.currentUser.email?.replaceAll('.', '_') || null;
      this.loadUserData();
    }
  }

  private initializeForm(): void {
    this.profileForm = this.fb.group({
      experience: this.fb.array([]),
    });
  }

  private async loadUserData(): Promise<void> {
    if (!this.userEmail) return;

    try {
      const userData = await this.firebaseService.getUserData(this.userEmail);
      this.populateExperiences(userData?.profileData?.experience || []);
    } catch (error) {
      console.error('Error loading experiences:', error);
    }
  }

  private populateExperiences(experiences: any[]): void {
    const formArray = this.experienceArray;
    formArray.clear();
    experiences.forEach(exp => {
      formArray.push(this.fb.group({
        year: [exp.year || ''],
        company: [exp.company || ''],
        role: [exp.role || ''],
        description: [exp.description || ''],
      }));
    });
  }

  get experienceArray(): FormArray {
    return this.profileForm.get('experience') as FormArray;
  }
}
