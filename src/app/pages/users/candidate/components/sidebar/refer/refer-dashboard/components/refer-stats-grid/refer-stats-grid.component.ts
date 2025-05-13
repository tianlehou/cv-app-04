import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-refer-stats-grid',
  templateUrl: './refer-stats-grid.component.html',
  styleUrls: ['./refer-stats-grid.component.css']
})
export class ReferStatsGridComponent {
  @Input() totalReferrals: number = 0;
  @Input() activeReferrals: number = 0;
  @Input() conversions: number = 0;
}