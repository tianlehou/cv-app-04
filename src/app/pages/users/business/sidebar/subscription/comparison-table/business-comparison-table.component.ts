import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-business-comparison-table',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './business-comparison-table.component.html',
  styleUrls: ['./business-comparison-table.component.css']
})
export class BusinessComparisonTableComponent {
  @Input() plans: any[] = [];
  @Input() recommendedPlanIndex: number = 1; // Índice del plan recomendado (por defecto el del medio)
}