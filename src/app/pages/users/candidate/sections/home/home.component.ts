import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output } from '@angular/core';
import { HeaderComponent } from './header/header.component';
// import { HeroSectionComponent } from './hero-section/hero-section.component';
import { FeaturesSectionComponent } from './features-section/features-section.component';
import { HowItWorksComponent } from './how-it-works/how-it-works.component';
import { TestimonialsSectionComponent } from './testimonials-section/testimonials-section.component';
import { CallToActionComponent } from './call-to-action/call-to-action.component';
import { ComparisonSectionComponent } from './comparison-section/comparison-section.component';
import { CandidateExamplesModalComponent } from './hero-section/candidate-examples-modal/candidate-examples-modal.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule, 
    HeaderComponent,
    // HeroSectionComponent,
    FeaturesSectionComponent,
    HowItWorksComponent,
    CandidateExamplesModalComponent,
    TestimonialsSectionComponent,
    CallToActionComponent,
    ComparisonSectionComponent,
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent {
  @Output() startNow = new EventEmitter<void>();

  onHeaderStartNow(): void {
    this.startNow.emit();
  }
}
