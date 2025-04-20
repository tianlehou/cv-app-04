import { Component, OnInit, Input } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { FirebaseService } from '../../../../../../../../../../../shared/services/firebase.service';
import { User } from '@angular/fire/auth';

@Component({
  selector: 'app-ats-education',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './ats-education.component.html',
  styleUrls: ['./ats-education.component.css'],
})
export class AtsEducationComponent implements OnInit {
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
      console.error('Error: Email de usuario no disponible');
      return;
    }
  
    try {
      const userData = await this.firebaseService.getUserData(this.userEmail);
      const education = userData?.profileData?.education || [];
      
      this.populateEducation(education);
    } catch (error) {
      console.error('Error al cargar educación:', error);
    }
  }

  private populateEducation(educationList: any[]): void {
    const formArray = this.educationArray;
    formArray.clear();
    
    if (educationList.length === 0) {
      formArray.push(this.fb.group({
        year: ['No especificado'],
        institution: ['No especificado'],
        degree: ['No especificado'],
      }));
    } else {
      educationList.forEach(edu => {
        formArray.push(this.fb.group({
          year: [edu.year || 'No especificado'],
          institution: [edu.institution || 'No especificado'],
          degree: [edu.degree || 'No especificado'],
        }));
      });
    }
  }

  get educationArray(): FormArray {
    return this.profileForm.get('education') as FormArray;
  }
}