import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-refer-stats-grid',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './refer-stats-grid.component.html',
  styleUrls: ['./refer-stats-grid.component.css']
})
export class ReferStatsGridComponent {
  @Input() currentReferrals: number = 0;
  @Input() subscribedReferrals: number = 0;
}