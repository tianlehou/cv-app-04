// referral-rewards.component.ts
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-referral-rewards',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './referral-rewards.component.html',
  styleUrls: ['./referral-rewards.component.css']
})
export class ReferralRewardsComponent {
  @Input() rewards: number = 0;
  
  rewardLevels = [
    { level: 1, points: 100, reward: 'Descuento 10%' },
    { level: 2, points: 500, reward: 'Descuento 15%' },
    { level: 3, points: 1000, reward: 'Descuento 20%' },
  ];
}