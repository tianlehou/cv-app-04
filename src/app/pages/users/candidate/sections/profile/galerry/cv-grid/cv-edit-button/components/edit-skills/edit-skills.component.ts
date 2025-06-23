// edit-skills.component.ts
import { Component, OnInit, Input, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { User } from '@angular/fire/auth';
import { FirebaseService } from 'src/app/shared/services/firebase.service';
import { ToastService } from 'src/app/shared/services/toast.service';
import { SkillsInfoComponent } from './skills-info/skills-info.component';
import { CvEditButtonRowComponent } from '../../cv-edit-button-row/cv-edit-button-row.component';

@Component({
  selector: 'app-edit-skills',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    CommonModule,
    SkillsInfoComponent,
    CvEditButtonRowComponent,
  ],
  templateUrl: './edit-skills.component.html',
  styleUrls: ['./edit-skills.component.css'],
})
export class EditSkillsComponent implements OnInit, OnDestroy {
  @Input() currentUser: User | null = null;
  profileForm!: FormGroup;
  isEditing: boolean = false;
  formHasChanges: boolean = false;
  private initialFormValue: any;
  private formSubscription: Subscription | null = null;

  constructor(
    private fb: FormBuilder,
    private firebaseService: FirebaseService,
    private toastService: ToastService
  ) { }

  ngOnInit(): void {
    this.initializeForm();
    if (this.currentUser?.email) {
      this.loadUserData();
    }
  }

  ngOnDestroy(): void {
    this.formSubscription?.unsubscribe();
  }

  private initializeForm(): void {
    this.profileForm = this.fb.group({
      hardSkills: ['', Validators.required],
      softSkills: [''],
      languages: [''],
      certification: ['']
    });
  }

  private async loadUserData(): Promise<void> {
    if (!this.currentUser?.email) return;

    try {
      const formattedEmail = this.firebaseService.formatEmailKey(this.currentUser.email);
      const userData = await this.firebaseService.getUserData(formattedEmail);
      const skillsData = userData?.profileData?.skills;

      if (skillsData) {
        this.profileForm.patchValue(skillsData);
      }

      this.initialFormValue = JSON.parse(JSON.stringify(this.profileForm.value));
    } catch (error) {
      console.error('Error loading skills:', error);
      this.toastService.show('Error al cargar las habilidades', 'error');
    }
  }

  toggleEdit(): void {
    if (!this.isEditing) {
      this.isEditing = true;
      this.initialFormValue = JSON.parse(JSON.stringify(this.profileForm.value));
      this.formHasChanges = false;

      this.formSubscription = this.profileForm.valueChanges.subscribe(() => {
        this.formHasChanges = !this.areObjectsEqual(
          this.initialFormValue,
          this.profileForm.value
        );
      });

      this.toastService.show('Modo edición habilitado', 'info');
    } else {
      if (this.formHasChanges) {
        this.onSubmit();
      } else {
        this.onCancel();
      }
    }
  }

  private areObjectsEqual(obj1: any, obj2: any): boolean {
    return JSON.stringify(obj1) === JSON.stringify(obj2);
  }

  async onSubmit(): Promise<void> {
    if (!this.profileForm.valid || !this.currentUser?.email) {
      this.toastService.show('Debes completar los campos requeridos.', 'error');
      return;
    }

    try {
      const formattedEmail = this.firebaseService.formatEmailKey(this.currentUser.email);
      const userData = await this.firebaseService.getUserData(formattedEmail);
      const currentProfileData = userData?.profileData || {};

      const updatedProfileData = {
        ...currentProfileData,
        skills: this.profileForm.value
      };

      await this.firebaseService.updateUserData(formattedEmail, {
        profileData: updatedProfileData,
      });

      this.toastService.show('Datos actualizados exitosamente', 'success');
      this.initialFormValue = JSON.parse(JSON.stringify(this.profileForm.value));
      this.isEditing = false;
      this.formHasChanges = false;
      this.formSubscription?.unsubscribe();
      this.formSubscription = null;
    } catch (error) {
      console.error('Error al actualizar las habilidades:', error);
      this.toastService.show(
        'Error al guardar los datos. Por favor, inténtalo nuevamente.',
        'error'
      );
    }
  }

  onCancel(): void {
    this.isEditing = false;
    this.profileForm.patchValue(this.initialFormValue);
    this.formHasChanges = false;
    this.formSubscription?.unsubscribe();
    this.formSubscription = null;
    this.toastService.show('Modo edición deshabilitado', 'info');
  }
}