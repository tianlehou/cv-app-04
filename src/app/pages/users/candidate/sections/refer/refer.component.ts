// refer.component.ts
import { Component} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReferralLinkComponent } from './referral-link/referral-link.component';
import { ReferDashboardComponent } from './refer-dashboard/refer-dashboard.component';


@Component({
  selector: 'app-refer',
  standalone: true,
  imports: [CommonModule, ReferralLinkComponent, ReferDashboardComponent],
  templateUrl: './refer.component.html',
  styleUrls: ['./refer.component.css'],
})
export class ReferComponent {

}