// stats-grid.component.ts
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-business-stats-grid',
  standalone: true,
  templateUrl: './business-stats-grid.component.html',
  styleUrls: ['./business-stats-grid.component.css']
})
export class BusinessStatsGridComponent {
  @Input() totalUsers: number = 0;
  @Input() totalBusiness: number = 0;
  @Input() totalCandidates: number = 0;
}