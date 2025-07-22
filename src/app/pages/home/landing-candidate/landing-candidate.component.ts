import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output } from '@angular/core';
import { HeroSectionComponent } from './hero-section/hero-section.component';
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
    HeroSectionComponent,
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
  @Output() startNow = new EventEmitter<void>();

  onHeaderStartNow(): void {
    this.startNow.emit();
  }
}
