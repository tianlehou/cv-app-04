import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-comparison-table',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './comparison-table.component.html',
  styleUrls: ['./comparison-table.component.css']
})
export class ComparisonTableComponent {
  @Input() plans: any[] = [];
  @Input() recommendedPlanIndex: number = 1; // Índice del plan recomendado (por defecto el del medio)
}