import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CandidateExamplesModalComponent } from './candidate-examples-modal/candidate-examples-modal.component';

@Component({
  selector: 'app-hero',
  standalone: true,
  imports: [CommonModule, CandidateExamplesModalComponent],
  templateUrl: './hero.component.html',
  styleUrls: ['./hero.component.css']
})
export class HeroComponent implements OnChanges {
  @Input() currentView: 'candidate' | 'business' = 'candidate';
  isModalVisible = false;

  // Textos para la vista de candidatos
  private candidateTexts = {
    title: 'Revolucionamos',
    subTitle: 'la contratación',
    leadUp: 'Conecta con las mejores oportunidades',
    leadDown: 'y muestra tu talento al mundo.',
    h2: 'Consigue el trabajo de tus sueños mostrando lo que realmente sabes hacer',
    p1: 'Tu talento en acción vale más que mil palabras.',
    p2: 'Sube fotos y videos de tu trabajo y deja que las oportunidades lleguen a ti.',
  };

  // Textos para la vista de empresas
  private businessTexts = {
    title: 'Revolucionamos',
    subTitle: 'la contratación',
    leadUp: 'Conecta con los mejores talentos',
    leadDown: 'para llevar tu empresa al siguiente nivel.',
    h2: 'Contrata talento real: Mira las habilidades en acción antes de entrevistar',
    p1: 'Reduce un 70% las contrataciones fallidas con perfiles verificados visualmente.',
    p2: 'Accede al mejor talento técnico, operativo y profesional demostrado en video.',
  };

  // Propiedades que se usarán en la plantilla
  title = this.candidateTexts.title;
  subTitle = this.candidateTexts.subTitle;
  leadUp = this.candidateTexts.leadUp;
  leadDown = this.candidateTexts.leadDown;
  h2 = this.candidateTexts.h2;
  p1 = this.candidateTexts.p1;
  p2 = this.candidateTexts.p2;

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
    this.h2 = texts.h2;
    this.p1 = texts.p1;
    this.p2 = texts.p2;
  }

  showExamplesModal(): void {
    this.isModalVisible = true;
  }

  onCloseModal(): void {
    this.isModalVisible = false;
  }
}
