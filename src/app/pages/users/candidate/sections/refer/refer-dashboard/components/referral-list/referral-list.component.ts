import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-referral-list',
  standalone: true,
  imports: [],
  templateUrl: './referral-list.component.html',
})
export class ReferralListComponent {
  @Input() referrals: any[] = [];
  columns = ['email', 'date', 'converted', 'actions'];
}
