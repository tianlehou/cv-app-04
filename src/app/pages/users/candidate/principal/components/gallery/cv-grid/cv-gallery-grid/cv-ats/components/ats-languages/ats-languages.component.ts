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
      languages: this.fb.array([]), // Array vacío
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

      this.populateLanguages(languages);
    } catch (error) {
      console.error('Error al cargar idiomas:', error);
    }
  }

  private populateLanguages(languages: any[]): void {
    const formArray = this.languagesArray;
    formArray.clear(); // Limpia el grupo inicial

    if (languages.length === 0) {
    } else {
      languages.forEach(lang => {
        formArray.push(this.fb.group({
          name: [lang.name || ''],
          proficiency: [lang.proficiency || ''],
          certification: [lang.certification || ''],
        }));
      });
    }
  }

  get languagesArray(): FormArray {
    return this.profileForm.get('languages') as FormArray;
  }
}