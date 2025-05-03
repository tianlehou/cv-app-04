import { Component, Input, OnInit } from '@angular/core';
import { User } from '@angular/fire/auth';
import { CommonModule } from '@angular/common';
import { AtsPersonalDataComponent } from './components/ats-personal-data/ats-personal-data.component';
import { AtsAboutMeComponent } from './components/ats-about-me/ats-about-me.component';
import { AtsExperienceComponent } from './components/ats-experience/ats-experience.component';
import { AtsEducationComponent } from './components/ats-education/ats-education.component';
import { AtsSkillsComponent } from './components/ats-skills/ats-skills.component';
import { AtsDownloadPdfComponent } from '../../../../../../../../../shared/components/ats-download-pdf/ats-download-pdf.component';
import { StyleControlComponent } from '../../style-control/style-control.component';
import { FirebaseService } from '../../../../../../../../../shared/services/firebase.service';
import { ComponentStyles } from '../../../../../../../../../shared/models/component-styles.model';

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
    AtsDownloadPdfComponent,
    StyleControlComponent,
  ],
  templateUrl: './ats-001.component.html',
  styleUrl: './ats-001.component.css',
})
export class Ats001Component implements OnInit {
  @Input() currentUser: User | null = null;
  currentStyles: ComponentStyles = {
    fontSize: '12px',
    padding: '2rem 2rem',
    barColor: '#0d6efd',
    fontFamily: 'Arial, sans-serif'
  };
  constructor(private firebaseService: FirebaseService) { }

  async ngOnInit() {
    const currentUser = await this.firebaseService.getCurrentUser();
    if (currentUser?.email) {
      const savedStyles = await this.firebaseService.getComponentStyles(
        currentUser.email,
        'ats-001'
      );

      if (savedStyles) {
        this.currentStyles = {
          ...this.currentStyles,
          ...savedStyles
        };
        this.applyStyles();
      }
    }
  }

  private applyStyles() {
    document.querySelectorAll('.bar').forEach((el: Element) => {
      (el as HTMLElement).style.backgroundColor = this.currentStyles.barColor;
    });
    
    const container = document.querySelector('.ats-container');
    if (container) {
      (container as HTMLElement).style.fontFamily = this.currentStyles.fontFamily;
    }
  }

  onStyleChange(styles: ComponentStyles) {
    this.currentStyles = styles;
    document.querySelectorAll('.bar').forEach((el: Element) => {
      (el as HTMLElement).style.backgroundColor = styles.barColor;
    });
    
    const container = document.querySelector('.ats-container');
    if (container) {
      (container as HTMLElement).style.fontFamily = styles.fontFamily;
    }
  }
}