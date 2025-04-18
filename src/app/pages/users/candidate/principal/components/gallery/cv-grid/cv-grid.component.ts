import { Component, ChangeDetectorRef, Input, OnInit } from '@angular/core';
import { User } from '@angular/fire/auth';
import { CommonModule } from '@angular/common';
import { CvInfoBarComponent } from './cv-info-bar/cv-info-bar.component';
import { CvEditButtonComponent } from './cv-edit-button/cv-edit-button.component';

// Grid-Components
import { CurriculumTypesInfoComponent } from './cv-gallery-grid/curriculum-types-info/curriculum-types-info.component';
import { CvCanvasComponent } from './cv-gallery-grid/cv-canvas/cv-canvas.component';
import { CvAtsComponent } from "./cv-gallery-grid/cv-ats/cv-ats.component";

// Edit-Components
import { EditAboutMeComponent } from './cv-edit-button/components/edit-about-me/edit-about-me.component';
import { EditEducationComponent } from './cv-edit-button/components/edit-education/edit-education.component';
import { EditExperienceComponent } from './cv-edit-button/components/edit-experience/edit-experience.component';
import { EditLanguagesComponent } from './cv-edit-button/components/edit-languages/edit-languages.component';
import { EditPersonalDataComponent } from './cv-edit-button/components/edit-personal-data/edit-personal-data.component';
import { EditProfilePictureComponent } from './cv-edit-button/components/edit-profile-picture/edit-profile-picture.component';
import { EditSkillsComponent } from './cv-edit-button/components/edit-skills/edit-skills.component';

@Component({
  selector: 'app-cv-grid',
  standalone: true,
  imports: [
    CommonModule,
    CvInfoBarComponent,
    CvEditButtonComponent,
    CurriculumTypesInfoComponent,
    CvCanvasComponent,
    CvAtsComponent,
    EditAboutMeComponent,
    EditEducationComponent,
    EditExperienceComponent,
    EditLanguagesComponent,
    EditPersonalDataComponent,
    EditProfilePictureComponent,
    EditSkillsComponent,
  ],
  templateUrl: './cv-grid.component.html',
  styleUrls: ['./cv-grid.component.css'],
})
export class CvGridComponent implements OnInit {
  @Input() currentUser: User | null = null;
  userEmailKey: string | null = null;
  selectedComponent: string | null = null;
  showGalleryGrid = false;
  showPrincipalSection = true;
  showCanvas = false;
  showAts = false;
  showCurriculumInfo = true;

  constructor(private cdr: ChangeDetectorRef) { }

  ngOnInit(): void {
    if (this.currentUser?.email) {
      this.userEmailKey = this.formatEmailKey(this.currentUser.email);
    }
  }

  private formatEmailKey(email: string): string {
    return email.replace(/\./g, '_');
  }

  onCanvasClicked() {
    this.showCanvas = true;
    this.showAts = false;
    this.showCurriculumInfo = false;
    this.cdr.detectChanges();
  }

  onAtsClicked() {
    this.showCanvas = false;
    this.showAts = true;
    this.showCurriculumInfo = false;
    this.cdr.detectChanges();
  }

  onOptionSelected(option: string) {
    this.selectedComponent = option;
    this.showGalleryGrid = true;
    this.showPrincipalSection = false;
    this.cdr.detectChanges();
  }

  // Método para determinar si se debe mostrar un componente específico
  shouldShowComponent(componentName: string): boolean {
    return this.selectedComponent === componentName;
  }

  // Método para cerrar el popover y restablecer la vista
  resetView() {
    this.selectedComponent = null;
    this.showGalleryGrid = false;
    this.showPrincipalSection = true;
    this.cdr.detectChanges();
  }

  handleBackToPrincipal() {
    console.log('Recibido backToPrincipal - showGalleryGrid:', this.showGalleryGrid);
    this.selectedComponent = null;
    this.showGalleryGrid = false;
    this.showPrincipalSection = true;
    this.showCanvas = false;
    this.showAts = false;
    this.showCurriculumInfo = true;
    this.cdr.detectChanges();
  }
}
