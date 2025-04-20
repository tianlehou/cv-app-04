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

      this.populateSkills(skills);
    } catch (error) {
      console.error('Error al cargar habilidades:', error);
    }
  }

  private populateSkills(skills: any[]): void {
    const formArray = this.skillsArray;
    formArray.clear();

    if (skills.length === 0) {
      formArray.push(this.fb.group({
        name: ['No especificado'],
        proficiency: ['No especificado'],
        certification: ['No especificado'],
      }));
    } else {
      skills.forEach(skill => {
        formArray.push(this.fb.group({
          name: [skill.name || 'No especificado'],
          proficiency: [skill.proficiency || 'No especificado'],
          certification: [skill.certification || 'No especificado'],
        }));
      });
    }
  }

  get skillsArray(): FormArray {
    return this.profileForm.get('skills') as FormArray;
  }
}