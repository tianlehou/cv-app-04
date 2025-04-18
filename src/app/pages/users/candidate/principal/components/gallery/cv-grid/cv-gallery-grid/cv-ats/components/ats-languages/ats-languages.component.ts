import { Component, OnInit, Input } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { FirebaseService } from '../../../../../../../../../../../shared/services/firebase.service';
import { User } from '@angular/fire/auth';

@Component({
  selector: 'app-ats-languages',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './ats-languages.component.html',
  styleUrls: ['./ats-languages.component.css'],
})
export class AtsLanguagesComponent implements OnInit {
  @Input() currentUser: User | null = null;
  profileForm!: FormGroup;
  userEmail: string | null = null;
  isLoading = true;

  constructor(
    private fb: FormBuilder,
    private firebaseService: FirebaseService
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    if (this.currentUser) {
      this.userEmail = this.currentUser.email?.replace(/\./g, '_') || null;
      this.loadUserData();
    } else {
      this.isLoading = false;
    }
  }

  private initializeForm(): void {
    this.profileForm = this.fb.group({
      languages: this.fb.array([]),
    });
  }

  private async loadUserData(): Promise<void> {
    if (!this.userEmail) {
      console.error('Error: Email de usuario no disponible');
      this.isLoading = false;
      return;
    }
  
    try {
      const userData = await this.firebaseService.getUserData(this.userEmail);
      const languages = userData?.profileData?.languages || [];
      
      this.populateLanguages(languages);
    } catch (error) {
      console.error('Error al cargar idiomas:', error);
    } finally {
      this.isLoading = false;
    }
  }

  private populateLanguages(languages: any[]): void {
    const formArray = this.languagesArray;
    formArray.clear();
    
    if (languages.length === 0) {
      formArray.push(this.fb.group({
        name: ['No especificado'],
        proficiency: ['No especificado'],
        certification: ['No especificado'],
      }));
    } else {
      languages.forEach(lang => {
        formArray.push(this.fb.group({
          name: [lang.name || 'No especificado'],
          proficiency: [lang.proficiency || 'No especificado'],
          certification: [lang.certification || 'No especificado'],
        }));
      });
    }
  }

  get languagesArray(): FormArray {
    return this.profileForm.get('languages') as FormArray;
  }
}