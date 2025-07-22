import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';

interface ComparisonItem {
  feature: string;
  withUs: boolean;
  traditional: boolean;
}

@Component({
  selector: 'app-comparison-section',
  standalone: true,
  imports: [CommonModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './comparison-section.component.html',
  styleUrls: ['./comparison-section.component.css']
})
export class ComparisonSectionComponent {
  comparisonData: ComparisonItem[] = [
    { feature: 'Muestras tus habilidades', withUs: true, traditional: false },
    { feature: 'Te encuentran empresas', withUs: true, traditional: false },
    { feature: 'Sin gastar en pasajes', withUs: true, traditional: false },
    { feature: 'Respuestas rápidas', withUs: true, traditional: false }
  ];
}
