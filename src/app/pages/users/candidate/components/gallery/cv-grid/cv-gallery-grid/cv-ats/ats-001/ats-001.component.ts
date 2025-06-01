import { Component, Input, OnInit } from '@angular/core';
import { User } from '@angular/fire/auth';
import { CommonModule } from '@angular/common';
import { AtsPersonalDataComponent } from './components/ats-personal-data/ats-personal-data.component';
import { AtsAboutMeComponent } from './components/ats-about-me/ats-about-me.component';
import { AtsExperienceComponent } from './components/ats-experience/ats-experience.component';
import { AtsEducationComponent } from './components/ats-education/ats-education.component';
import { AtsSkillsComponent } from './components/ats-skills/ats-skills.component';
import { DownloadPdfComponent } from '../../../../../../../../../shared/components/download-pdf/download-pdf.component';
import { StyleControlComponent } from '../../style-control/style-control.component';
import { FirebaseService } from '../../../../../../../../../shared/services/firebase.service';
import { ComponentStyles } from '../../style-control/component-styles.model';
import { StyleService } from '../../style-control/style-control.service';

@Component({
  selector: 'app-ats-001',
  standalone: true,
  imports: [
    CommonModule,
    AtsPersonalDataComponent,
    AtsAboutMeComponent,
    AtsExperienceComponent,
    AtsSkillsComponent,
    AtsEducationComponent,
    DownloadPdfComponent,
    StyleControlComponent,
  ],
  templateUrl: './ats-001.component.html',
  styleUrl: './ats-001.component.css',
})
export class Ats001Component implements OnInit {
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
        'ats-001'
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