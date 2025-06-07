import { Component, OnInit, Input, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { User } from '@angular/fire/auth';
import { Subscription } from 'rxjs';
import { ProfileService } from '../../services/profile.service';
import { PersonalDataService } from '../../services/personal-data.service';

@Component({
  selector: 'app-personal-data',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './personal-data.component.html',
  styleUrls: ['./personal-data.component.css'],
})
export class PersonalDataComponent implements OnInit, OnDestroy {
  @Input() currentUser: User | null = null;
  profileForm!: FormGroup;
  editableFields: { [key: string]: boolean } = {};
  private subscription!: Subscription;

  countries = [
    { code: 'Panama', name: 'Panamá' },
    { code: 'Argentina', name: 'Argentina' },
    { code: 'Bolivia', name: 'Bolivia' },
    { code: 'Brazil', name: 'Brasil' },
    { code: 'Chile', name: 'Chile' },
    { code: 'Colombia', name: 'Colombia' },
    { code: 'Costa Rica', name: 'Costa Rica' },
    { code: 'Cuba', name: 'Cuba' },
    { code: 'Ecuador', name: 'Ecuador' },
    { code: 'El Salvador', name: 'El Salvador' },
    { code: 'España', name: 'España' },
    { code: 'USA', name: 'Estados Unidos' },
    { code: 'Guatemala', name: 'Guatemala' },
    { code: 'Honduras', name: 'Honduras' },
    { code: 'Nicaragua', name: 'Nicaragua' },
    { code: 'Mexico', name: 'México' },
    { code: 'Paraguay', name: 'Paraguay' },
    { code: 'Peru', name: 'Perú' },
    { code: 'Puerto Rico', name: 'Puerto Rico' },
    { code: 'Rep. Dominicana', name: 'República Dominicana' },
    { code: 'Uruguay', name: 'Uruguay' },
    { code: 'Venezuela', name: 'Venezuela' },
  ];

  constructor(
    private fb: FormBuilder,
    private profileService: ProfileService,
    private personalDataService: PersonalDataService,
  ) { }

  ngOnInit(): void {
    this.initializeForm();
    if (this.currentUser) {
      this.loadUserData();
    }

    this.subscription = this.profileService.personalDataUpdated$.subscribe(
      (updatedData) => this.profileForm.patchValue(updatedData || {})
    );
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  private initializeForm(): void {
    this.profileForm = this.fb.group({
      fullName: [''],
      profesion: [''],
      phone: [''],
      editableEmail: [''],
      direction: [''],
      country: [''],
    });
  }

  private async loadUserData(): Promise<void> {
    try {
      const personalData = await this.personalDataService.loadUserData(this.currentUser);
      this.profileForm.patchValue(personalData || {});
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  }

  getCountryName(countryCode: string): string {
    const country = this.countries.find(c => c.code === countryCode);
    return country ? country.name : countryCode;
  }
}