import { Component, OnInit, Input } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { FirebaseService } from 'src/app/shared/services/firebase.service';
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
  
  // Propiedades para manejar los idiomas categorizados
  languagesWithDetails: any[] = [];
  languagesWithoutDetails: any[] = [];

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
      languages: this.fb.array([]),
    });
  }

  private async loadUserData(): Promise<void> {
    if (!this.userEmail) {
      console.error('Error: Email de usuario no disponible');
      return;
    }

    try {
      const userData = await this.firebaseService.getUserData(this.userEmail);
      const languages = userData?.profileData?.languages || [];
      this.categorizeLanguages(languages);
      this.populateForm();
    } catch (error) {
      console.error('Error al cargar idiomas:', error);
    }
  }

  private categorizeLanguages(languages: any[]): void {
    this.languagesWithDetails = [];
    this.languagesWithoutDetails = [];

    languages.forEach(language => {
      const hasProficiency = language.proficiency && 
                           language.proficiency.trim() !== '' && 
                           language.proficiency !== 'No especificado';
      const hasCertification = language.certification && 
                             language.certification.trim() !== '' && 
                             language.certification !== 'No especificado';

      if (hasProficiency || hasCertification) {
        this.languagesWithDetails.push(language);
      } else {
        this.languagesWithoutDetails.push(language);
      }
    });
  }

  private populateForm(): void {
    const formArray = this.languagesArray;
    formArray.clear();

    // Combinamos ambas listas (con detalles primero)
    const allLanguages = [...this.languagesWithDetails, ...this.languagesWithoutDetails];

    if (allLanguages.length === 0) {
      formArray.push(this.fb.group({
        name: ['Sin idiomas registrados'],
        proficiency: [''],
        certification: [''],
      }));
    } else {
      allLanguages.forEach(language => {
        formArray.push(this.fb.group({
          name: [language.name || ''],
          proficiency: [language.proficiency || ''],
          certification: [language.certification || ''],
        }));
      });
    }
  }

  get languagesArray(): FormArray {
    return this.profileForm.get('languages') as FormArray;
  }
}