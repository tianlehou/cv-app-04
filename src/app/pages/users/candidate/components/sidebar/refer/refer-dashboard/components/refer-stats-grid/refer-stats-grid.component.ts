// stats-grid.component.ts
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-refer-stats-grid',
  standalone: true,
  templateUrl: './refer-stats-grid.component.html',
  styleUrls: ['./refer-stats-grid.component.css']
})
export class ReferStatsGridComponent {
  @Input() totalUsers: number = 0;
  @Input() totalCandidates: number = 0;
  @Input() totalCompanies: number = 0;
}