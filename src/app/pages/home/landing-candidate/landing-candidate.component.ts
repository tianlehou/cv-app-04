import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FeaturesSectionComponent } from './features-section/features-section.component';
import { HowItWorksComponent } from './how-it-works/how-it-works.component';
import { TestimonialsSectionComponent } from './testimonials-section/testimonials-section.component';
// import { CallToActionComponent } from './call-to-action/call-to-action.component';
import { ComparisonSectionComponent } from './comparison-section/comparison-section.component';

@Component({
  selector: 'app-landing-candidate',
  standalone: true,
  imports: [
    CommonModule, 
    FeaturesSectionComponent,
    HowItWorksComponent,
    TestimonialsSectionComponent,
    // CallToActionComponent,
    ComparisonSectionComponent,
  ],
  templateUrl: './landing-candidate.component.html',
  styleUrl: './landing-candidate.component.css'
})
export class LandingCandidateComponent {

}
