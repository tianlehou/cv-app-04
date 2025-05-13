import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-referral-rewards',
  standalone: true,
  imports: [],
  templateUrl: './referral-rewards.component.html',
})
export class ReferralRewardsComponent {
  @Input() rewards: number = 0;
  rewardLevels = [
    { level: 1, points: 50, reward: 'Descuento 10%' },
    { level: 2, points: 100, reward: 'Descuento 20%' },
    { level: 3, points: 200, reward: 'Certificado Premium' },
  ];
}
