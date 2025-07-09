import { Component, ChangeDetectorRef, Input, OnInit } from '@angular/core';
import { User } from '@angular/fire/auth';
import { CommonModule } from '@angular/common';
import { CvInfoBarComponent } from './cv-info-bar/cv-info-bar.component';
import { CvEditButtonComponent } from './cv-edit-button/cv-edit-button.component';

// Grid-Components
import { CurriculumTypesInfoComponent } from './cv-gallery-grid/curriculum-types-info/curriculum-types-info.component';
import { Canvas001Component } from './cv-gallery-grid/cv-canvas/canvas-001/canvas-001.component';
import { Ats001Component } from "./cv-gallery-grid/cv-ats/ats-001/ats-001.component";

// Edit-Components
import { EditAboutMeComponent } from './cv-edit-button/components/edit-about-me/edit-about-me.component';
import { EditEducationComponent } from './cv-edit-button/components/edit-education/edit-education.component';
import { EditExperienceComponent } from './cv-edit-button/components/edit-experience/edit-experience.component';
import { EditLanguagesComponent } from './cv-edit-button/components/edit-languages/edit-languages.component';
import { EditSkillsComponent } from './cv-edit-button/components/edit-skills/edit-skills.component';

@Component({
  selector: 'app-cv-grid',
  standalone: true,
  imports: [
    CommonModule,
    CvInfoBarComponent,
    CvEditButtonComponent,
    CurriculumTypesInfoComponent,
    Canvas001Component,
    Ats001Component,
    EditAboutMeComponent,
    EditEducationComponent,
    EditExperienceComponent,
    EditLanguagesComponent,
    EditSkillsComponent,
  ],
  templateUrl: './cv-grid.component.html',
  styleUrls: ['./cv-grid.component.css'],
})
export class CvGridComponent implements OnInit {
  @Input() currentUser: User | null = null;
  @Input() readOnly: boolean = false;
  @Input() isOwner: boolean = true;
  userEmailKey: string | null = null;
  selectedComponent: string | null = null;
  showGalleryGrid = false;
  showPrincipalSection = true;
  showCanvas = false;
  showAts = false;
  showCurriculumInfo = true;
  activeSection: 'canvas' | 'ats' | null = null;
  disableInfoBar = false;

  constructor(private cdr: ChangeDetectorRef) { }

  ngOnInit(): void {
    if (this.currentUser?.email) {
      this.userEmailKey = this.formatEmailKey(this.currentUser.email);
    }
    
    // Si no es el propietario (ej. admin viendo perfil), mostrar canvas por defecto
    if (!this.isOwner) {
      this.onCanvasClicked();
    }
  }

  private formatEmailKey(email: string): string {
    return email.replace(/\./g, '_');
  }

  onCanvasClicked() {
    if (!this.showGalleryGrid) { // Solo permite activar si no estamos en edición
      this.activeSection = 'canvas';
      this.showCanvas = true;
      this.showAts = false;
      this.showCurriculumInfo = false;
      this.cdr.detectChanges();
    }
  }

  onAtsClicked() {
    if (!this.showGalleryGrid) { // Solo permite activar si no estamos en edición
      this.activeSection = 'ats';
      this.showCanvas = false;
      this.showAts = true;
      this.showCurriculumInfo = false;
      this.cdr.detectChanges();
    }
  }

  onOptionSelected(option: string) {
    this.activeSection = null; // Limpia cualquier selección activa
    this.disableInfoBar = true; // Deshabilita los botones
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
    this.activeSection = null; // Mantiene los botones sin activar
    this.disableInfoBar = false; // Reactiva los botones
    this.selectedComponent = null;
    this.showGalleryGrid = false;
    this.showPrincipalSection = true;
    this.showCanvas = false;
    this.showAts = false;
    this.showCurriculumInfo = true;
    this.cdr.detectChanges();
  }
}

