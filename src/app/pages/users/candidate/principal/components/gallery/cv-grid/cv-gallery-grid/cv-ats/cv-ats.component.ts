import { Component, Input } from '@angular/core';
import { User } from '@angular/fire/auth';
import { CommonModule } from '@angular/common';
import { AtsPersonalDataComponent } from './components/ats-personal-data/ats-personal-data.component';
import { AtsAboutMeComponent } from './components/ats-about-me/ats-about-me.component';
import { AtsExperienceComponent } from './components/ats-experience/ats-experience.component';
import { AtsSkillsComponent } from './components/ats-skills/ats-skills.component';
import { AtsEducationComponent } from './components/ats-education/ats-education.component';
import { AtsLanguagesComponent } from './components/ats-languages/ats-languages.component';

@Component({
  selector: 'app-cv-ats',
  standalone: true,
  imports: [
    CommonModule, 
    AtsPersonalDataComponent,
    AtsAboutMeComponent,
    AtsExperienceComponent,
    AtsSkillsComponent,
    AtsEducationComponent,
    AtsLanguagesComponent,
  ],
  templateUrl: './cv-ats.component.html',
  styleUrl: './cv-ats.component.css',
})
export class CvAtsComponent {
  @Input() currentUser: User | null = null;
}
