import { Component, Input, OnInit } from '@angular/core';
import { User } from '@angular/fire/auth';
import { CommonModule } from '@angular/common';
import { Canvas001ProfilePictureComponent } from './components/canvas-001-profile-picture/canvas-001-profile-picture.component';
import { Canvas001PersonalDataComponent } from './components/canvas-001-personal-data/canvas-001-personal-data.component';
import { Canvas001AboutMeComponent } from './components/canvas-001-about-me/canvas-001-about-me.component';
import { Canvas001ExperienceComponent } from './components/canvas-001-experience/canvas-001-experience.component';
import { Canvas001EducationComponent } from './components/canvas-001-education/canvas-001-education.component';
import { Canvas001SkillsComponent } from './components/canvas-001-skills/canvas-001-skills.component';
import { DownloadPdfComponent } from '../../../../../../../../../shared/components/download-pdf/download-pdf.component';
import { FirebaseService } from '../../../../../../../../../shared/services/firebase.service';
import { ComponentStyles } from '../../style-control/component-styles.model';
import { StyleControlComponent } from '../../style-control/style-control.component';
import { StyleService } from '../../style-control/style-control.service';

@Component({
  selector: 'app-canvas-001',
  standalone: true,
  imports: [
    CommonModule,
    DownloadPdfComponent,
    StyleControlComponent,
    Canvas001ProfilePictureComponent,
    Canvas001PersonalDataComponent,
    Canvas001AboutMeComponent,
    Canvas001ExperienceComponent,
    Canvas001SkillsComponent,
    Canvas001EducationComponent,
  ],
  templateUrl: './canvas-001.component.html',
  styleUrl: './canvas-001.component.css',
})
export class Canvas001Component implements OnInit {
  @Input() currentUser: User | null = null;
  @Input() readOnly: boolean = false;
  currentStyles: ComponentStyles = {
    fontSize: '12px',
    padding: '2rem 2rem',
    barColor: '#0d6efd',
    fontFamily: 'Arial, sans-serif'
  };
  constructor(
    private firebaseService: FirebaseService,
    private styleService: StyleService,
  ) { }

  async ngOnInit() {
    const currentUser = await this.firebaseService.getCurrentUser();
    if (currentUser?.email) {
      const savedStyles = await this.styleService.getComponentStyles(
        currentUser.email,
        'canvas-001'
      );

      if (savedStyles) {
        // Asegúrate de que el color personalizado se cargue correctamente
        this.currentStyles = {
          fontSize: savedStyles.fontSize || this.currentStyles.fontSize,
          padding: savedStyles.padding || this.currentStyles.padding,
          barColor: savedStyles.barColor || this.currentStyles.barColor,
          fontFamily: savedStyles.fontFamily || this.currentStyles.fontFamily
        };
        this.applyStyles();
      }
    }
  }

  private applyStyles() {
    // Aplica el color de barra (ya sea personalizado o predefinido)
    document.querySelectorAll('.bar').forEach((el: Element) => {
      (el as HTMLElement).style.backgroundColor = this.currentStyles.barColor;
    });

    const container = document.querySelector('.ats-container');
    if (container) {
      (container as HTMLElement).style.fontFamily = this.currentStyles.fontFamily;
      (container as HTMLElement).style.padding = this.currentStyles.padding;
      (container as HTMLElement).style.fontSize = this.currentStyles.fontSize;
    }
  }

  onStyleChange(styles: ComponentStyles) {
    this.currentStyles = styles;
    this.applyStyles();
  }
}