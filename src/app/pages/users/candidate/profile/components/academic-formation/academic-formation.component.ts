import { Component, OnInit, Input } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormArray,
  ReactiveFormsModule,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { FirebaseService } from '../../../../../../shared/services/firebase.service';
import { User } from '@angular/fire/auth';

@Component({
  selector: 'app-academic-formation',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './academic-formation.component.html',
  styleUrls: ['./academic-formation.component.css'],
})
export class AcademicFormationComponent implements OnInit {
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
      this.userEmail = this.currentUser.email?.replaceAll('.', '_') || null;
      this.loadUserData();
    }
  }

  private initializeForm(): void {
    this.profileForm = this.fb.group({
      academicFormation: this.fb.array([]),
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
      this.populateAcademicFormation(profileData.academicFormation || []);
    } catch (error) {
      console.error('Error al cargar los datos del usuario:', error);
    }
  }

  private populateAcademicFormation(formationList: any[]): void {
    const formArray = this.academicFormationArray;
    formArray.clear();
    formationList.forEach((formation) => {
      const formationGroup = this.fb.group({
        year: [formation.year || ''],
        institution: [formation.institution || ''],
        degree: [formation.degree || ''],
      });
      formArray.push(formationGroup);
    });
  }

  get academicFormationArray(): FormArray {
    return this.profileForm.get('academicFormation') as FormArray;
  }
}