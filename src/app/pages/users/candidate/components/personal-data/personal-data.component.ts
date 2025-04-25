import { Component, OnInit, Input, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { User } from '@angular/fire/auth';
import { Subscription } from 'rxjs';
import { FirebaseService } from '../../../../../shared/services/firebase.service';
import { ProfileService } from '../../services/profile.service';

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
  userEmail: string | null = null;
  editableFields: { [key: string]: boolean } = {};
  private subscription!: Subscription;

  constructor(
    private fb: FormBuilder,
    private firebaseService: FirebaseService,
    private profileService: ProfileService
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    if (this.currentUser) {
      this.userEmail = this.currentUser.email?.replaceAll('.', '_') || null;
      this.loadUserData();
    }
  
    // Suscribirse a los cambios
    this.subscription = this.profileService.personalDataUpdated$.subscribe(
      (updatedData) => {
        if (updatedData) {
          this.updateFormWithNewData(updatedData);
        }
      }
    );
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  private updateFormWithNewData(updatedData: any): void {
    console.log('Datos recibidos:', updatedData);
    this.profileForm.patchValue({
      fullName: updatedData?.fullName || this.profileForm.value.fullName || '',
      profesion: updatedData?.profesion || this.profileForm.value.profesion || '',
      phone: updatedData?.phone || this.profileForm.value.phone || '',
      editableEmail: updatedData?.editableEmail || this.profileForm.value.editableEmail || '',
      direction: updatedData?.direction || this.profileForm.value.direction || '',
    });
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
    if (!this.userEmail) return;

    try {
      const userData = await this.firebaseService.getUserData(this.userEmail);
      this.profileForm.patchValue({
        fullName: userData?.fullName || '',
        profesion: userData?.profileData?.personalData?.profesion || '',
        phone: userData?.profileData?.personalData?.phone || '',
        editableEmail: userData?.profileData?.personalData?.editableEmail || '',
        direction: userData?.profileData?.personalData?.direction || '',
      });
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  }
}