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
}