import { Component, OnInit, Input } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormArray,
  ReactiveFormsModule,
} from '@angular/forms';
import { User } from '@angular/fire/auth';
import { CommonModule } from '@angular/common';
import { FirebaseService } from '../../../../../../../../../../../shared/services/firebase.service';
import { FormatListPipe } from '../../format-list.pipe';

@Component({
  selector: 'app-canvas-001-skills',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    CommonModule,
    FormatListPipe,
  ],
  templateUrl: './canvas-001-skills.component.html',
  styleUrls: ['./canvas-001-skills.component.css'],
})
export class Canvas001SkillsComponent implements OnInit {
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
      skills: this.fb.array([]),
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
      this.populateSkills(profileData.skills || []);
    } catch (error) {
      console.error('Error al cargar los datos del usuario:', error);
    }
  }

  private populateSkills(skillList: any[]): void {
    const formArray = this.skillsArray;
    formArray.clear();
    skillList.forEach((skill) => {
      const skillGroup = this.fb.group({
        hardSkills: [skill.hardSkills || ''],
        softSkills: [skill.softSkills || ''],
        languages: [skill.languages || ''],
        certification: [skill.certification || ''],
      });
      formArray.push(skillGroup);
    });
  }

  get skillsArray(): FormArray {
    return this.profileForm.get('skills') as FormArray;
  }
}