import { Component, OnInit, Input } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { User } from '@angular/fire/auth';
import { PersonalDataService } from 'src/app/pages/users/candidate/services/personal-data.service';

@Component({
  selector: 'app-canvas-001-personal-data',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './canvas-001-personal-data.component.html',
  styleUrls: ['./canvas-001-personal-data.component.css'],
})
export class Canvas001PersonalDataComponent implements OnInit {
  @Input() currentUser: User | null = null;
  @Input() displayMode: 'header' | 'sidebar' = 'header';
  profileForm!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private personalDataService: PersonalDataService
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    if (this.currentUser) {
      this.loadUserData();
    }
  }

  private initializeForm(): void {
    this.profileForm = this.fb.group({
      fullName: [''],
      profesion: [''],
      phone: [''],
      editableEmail: [''],
      direction: [''],
    });
  }

  private async loadUserData(): Promise<void> {
    try {
      const personalData = await this.personalDataService.loadUserData(
        this.currentUser
      );
      this.profileForm.patchValue(personalData || {});
    } catch (error) {
      console.error('Error al cargar datos personales:', error);
    }
  }
}
