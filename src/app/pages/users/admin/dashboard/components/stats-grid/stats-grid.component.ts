// stats-grid.component.ts
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-stats-grid',
  standalone: true,
  templateUrl: './stats-grid.component.html',
  styleUrls: ['./stats-grid.component.css']
})
export class StatsGridComponent {
  @Input() totalUsers: number = 0;
  @Input() totalCandidates: number = 0;
  @Input() totalCompanies: number = 0;
}