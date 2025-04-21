import { Component, OnInit, Input } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { FirebaseService } from '../../../../../../../../../../../shared/services/firebase.service';
import { User } from '@angular/fire/auth';

@Component({
  selector: 'app-ats-skills',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './ats-skills.component.html',
  styleUrls: ['./ats-skills.component.css'],
})
export class AtsSkillsComponent implements OnInit {
  @Input() currentUser: User | null = null;
  profileForm!: FormGroup;
  userEmail: string | null = null;
  
  // Propiedades para manejar las habilidades categorizadas
  skillsWithDetails: any[] = [];
  skillsWithoutDetails: any[] = [];

  constructor(
    private fb: FormBuilder,
    private firebaseService: FirebaseService
  ) { }

  ngOnInit(): void {
    this.initializeForm();
    if (this.currentUser) {
      this.userEmail = this.currentUser.email?.replace(/\./g, '_') || null;
      this.loadUserData();
    }
  }

  private initializeForm(): void {
    this.profileForm = this.fb.group({
      skills: this.fb.array([]),
    });
  }

  private async loadUserData(): Promise<void> {
    if (!this.userEmail) {
      console.error('Error: Email de usuario no disponible');
      return;
    }

    try {
      const userData = await this.firebaseService.getUserData(this.userEmail);
      const skills = userData?.profileData?.skills || [];
      this.categorizeSkills(skills);
      this.populateForm();
    } catch (error) {
      console.error('Error al cargar habilidades:', error);
    }
  }

  private categorizeSkills(skills: any[]): void {
    this.skillsWithDetails = [];
    this.skillsWithoutDetails = [];

    skills.forEach(skill => {
      const hasProficiency = skill.proficiency && 
                           skill.proficiency.trim() !== '' && 
                           skill.proficiency !== 'No especificado';
      const hasCertification = skill.certification && 
                             skill.certification.trim() !== '' && 
                             skill.certification !== 'No especificado';

      if (hasProficiency || hasCertification) {
        this.skillsWithDetails.push(skill);
      } else {
        this.skillsWithoutDetails.push(skill);
      }
    });
  }

  private populateForm(): void {
    const formArray = this.skillsArray;
    formArray.clear();

    // Combinamos ambas listas (con detalles primero)
    const allSkills = [...this.skillsWithDetails, ...this.skillsWithoutDetails];

    if (allSkills.length === 0) {
      formArray.push(this.fb.group({
        name: ['Sin habilidades registradas'],
        proficiency: [''],
        certification: [''],
      }));
    } else {
      allSkills.forEach(skill => {
        formArray.push(this.fb.group({
          name: [skill.name || ''],
          proficiency: [skill.proficiency || ''],
          certification: [skill.certification || ''],
        }));
      });
    }
  }

  get skillsArray(): FormArray {
    return this.profileForm.get('skills') as FormArray;
  }
}