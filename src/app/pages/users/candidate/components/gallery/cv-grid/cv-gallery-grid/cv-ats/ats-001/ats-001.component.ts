import { Component, Input } from '@angular/core';
import { User } from '@angular/fire/auth';
import { CommonModule } from '@angular/common';
import { AtsPersonalDataComponent } from './components/ats-personal-data/ats-personal-data.component';
import { AtsAboutMeComponent } from './components/ats-about-me/ats-about-me.component';
import { AtsExperienceComponent } from './components/ats-experience/ats-experience.component';
import { AtsEducationComponent } from './components/ats-education/ats-education.component';
import { AtsSkillsComponent } from './components/ats-skills/ats-skills.component';
import { AtsDownloadPdfComponent } from '../../../../../../../../../shared/components/ats-download-pdf/ats-download-pdf.component';
import { StyleControlComponent } from '../../style-control/style-control.component';

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
export class Ats001Component {
  @Input() currentUser: User | null = null;
  currentStyles = {
    fontSize: '14px',
    padding: '2rem',
    barColor: '#0d6efd',
    fontFamily: 'Arial, sans-serif'
  };

  onStyleChange(styles: {fontSize: string, padding: string, barColor: string, fontFamily: string}) {
    this.currentStyles = styles;
    // Aplicar los estilos a los elementos
    document.querySelectorAll('.bar').forEach((el: Element) => {
      (el as HTMLElement).style.backgroundColor = styles.barColor;
    });
    // Aplicar la fuente al contenedor principal
    const container = document.querySelector('.ats-container');
    if (container) {
      (container as HTMLElement).style.fontFamily = styles.fontFamily;
    }
  }
}