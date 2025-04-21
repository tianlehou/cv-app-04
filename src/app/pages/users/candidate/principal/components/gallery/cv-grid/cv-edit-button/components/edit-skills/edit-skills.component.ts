import { Component, OnInit, Input } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormArray,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { FirebaseService } from '../../../../../../../../../../shared/services/firebase.service';
import { ConfirmationModalService } from '../../../../../../../../../../shared/services/confirmation-modal.service';
import { User } from '@angular/fire/auth';
import { SkillsInfoComponent } from './skills-info/skills-info.component';
import { ToastService } from '../../../../../../../../../../shared/services/toast.service';

@Component({
  selector: 'app-edit-skills',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, SkillsInfoComponent],
  templateUrl: './edit-skills.component.html',
  styleUrls: ['./edit-skills.component.css'],
})
export class EditSkillsComponent implements OnInit {
  @Input() currentUser: User | null = null;
  profileForm!: FormGroup;
  userEmail: string | null = null;
  editableFields: { [key: string]: boolean } = {};
  skillIndexToDelete: number | null = null;
  showInfoComponent = false;

  constructor(
    private fb: FormBuilder,
    private firebaseService: FirebaseService,
    private ConfirmationModalService: ConfirmationModalService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    this.setEditableFields();
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

  private setEditableFields(): void {
    this.editableFields = {
      skills: false,
    };
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
        name: [skill.name || '', Validators.required],
        proficiency: [skill.proficiency || ''],
        certification: [skill.certification || ''],
      });
      formArray.push(skillGroup);
    });
  }

  toggleEdit(field: string): void {
    this.editableFields[field] = !this.editableFields[field];
    if (!this.editableFields[field]) {
      this.onSubmit();
    }
  }

  async onSubmit(): Promise<void> {
    if (!this.profileForm.valid || !this.userEmail) {
      this.toastService.show('Error en los datos o usuario no autenticado.', 'error');
      return;
    }

    try {
      const userData = await this.firebaseService.getUserData(this.userEmail);
      const currentProfileData = userData?.profileData || {};

      const updatedProfileData = {
        ...currentProfileData,
        skills: this.skillsArray.value,
      };

      await this.firebaseService.updateUserData(this.userEmail, {
        profileData: updatedProfileData,
      });

      this.toastService.show('Datos actualizados exitosamente.', 'success');

      await this.loadUserData();
    } catch (error) {
      console.error('Error al actualizar el perfil:', error);
      this.toastService.show('Error al guardar datos. Intenta nuevamente.', 'error');
    }
  }

  get skillsArray(): FormArray {
    return this.profileForm.get('skills') as FormArray;
  }

  addSkill(): void {
    const skillGroup = this.fb.group({
      name: ['', Validators.required],
      proficiency: [''],
      certification: [''],
    });
    this.skillsArray.push(skillGroup);
  }

  async removeSkill(index: number): Promise<void> {
    if (index < 0 || index >= this.skillsArray.length) {
      console.error('Índice inválido al intentar eliminar una habilidad.');
      return;
    }

    this.skillsArray.removeAt(index);

    if (this.userEmail) {
      try {
        const userData = await this.firebaseService.getUserData(this.userEmail);
        const currentProfileData = userData?.profileData || {};

        const updatedProfileData = {
          ...currentProfileData,
          skills: this.skillsArray.value,
        };

        await this.firebaseService.updateUserData(this.userEmail, {
          profileData: updatedProfileData,
        });

        console.log(
          'Habilidad eliminada y datos sincronizados con la base de datos.'
        );
      } catch (error) {
        console.error(
          'Error al sincronizar los datos con la base de datos:',
          error
        );
      }
    } else {
      console.error(
        'Usuario no autenticado. No se puede actualizar la base de datos.'
      );
    }
  }

  confirmDeleteSkill(index: number): void {
    this.skillIndexToDelete = index;
    this.ConfirmationModalService.show(
      {
        title: 'Eliminar Habilidad',
        message: '¿Estás seguro de que deseas eliminar este habilidad?',
      },
      () => this.onDeleteConfirmed()
    );
  }

  onDeleteConfirmed(): void {
    if (this.skillIndexToDelete !== null) {
      this.removeSkill(this.skillIndexToDelete);
    }
    this.skillIndexToDelete = null;
  }

  // método para abrir componente-info
  openInfoModal(): void {
    this.showInfoComponent = true;
  }

  // método para cerrar componente-info
  toggleInfoView(): void {
    this.showInfoComponent = !this.showInfoComponent;
  }
}
