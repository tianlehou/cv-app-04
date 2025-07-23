import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-hero',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './hero.component.html',
  styleUrls: ['./hero.component.css']
})
export class HeroComponent implements OnChanges {
  @Input() currentView: 'candidate' | 'business' = 'candidate';
  
  // Textos para la vista de candidatos
  private candidateTexts = {
    title: 'Revolucionamos',
    subTitle: 'la contratación',
    leadUp: 'Conecta con las mejores oportunidades',
    leadDown: 'y muestra tu talento al mundo.'
  };
  
  // Textos para la vista de empresas
  private businessTexts = {
    title: 'Revolucionamos',
    subTitle: 'la contratación',
    leadUp: 'Conecta con los mejores talentos',
    leadDown: 'para llevar tu empresa al siguiente nivel.'
  };
  
  // Propiedades que se usarán en la plantilla
  title = this.candidateTexts.title;
  subTitle = this.candidateTexts.subTitle;
  leadUp = this.candidateTexts.leadUp;
  leadDown = this.candidateTexts.leadDown;

  ngOnChanges(changes: SimpleChanges) {
    if (changes['currentView']) {
      this.updateTexts();
    }
  }

  private updateTexts() {
    const texts = this.currentView === 'candidate' ? this.candidateTexts : this.businessTexts;
    this.title = texts.title;
    this.subTitle = texts.subTitle;
    this.leadUp = texts.leadUp;
    this.leadDown = texts.leadDown;
  }
}
