import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BusinessProblemsComponent } from './problems/problems.component';
import { BusinessBenefitsComponent } from './benefits/benefits.component';
import { BusinessTestimonialsComponent } from './testimonials/testimonials.component';
import { BusinessHowItWorksComponent } from './how-it-works/how-it-works.component';
import { BusinessComparisonComponent } from './comparison/comparison.component';
import { BusinessCallToActionComponent } from './cta/cta.component';

@Component({
  selector: 'app-landing-business',
  standalone: true,
  imports: [CommonModule, BusinessProblemsComponent, BusinessBenefitsComponent, BusinessTestimonialsComponent,
    BusinessHowItWorksComponent, BusinessComparisonComponent, BusinessCallToActionComponent
  ],
  templateUrl: './landing-business.component.html',
  styleUrls: ['./landing-business.component.css']
})
export class LandingBusinessComponent {

}