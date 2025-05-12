// referral-dashboard.component.ts
import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FirebaseService } from 'src/app/shared/services/firebase.service';

@Component({
  selector: 'app-referral-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './referral-dashboard.component.html',
  styleUrls: ['./referral-dashboard.component.css'],
})
export class ReferralDashboardComponent implements OnInit {
  referralData: any = null;
  loading = true;

  constructor(private firebaseService: FirebaseService) {}

  async ngOnInit() {
    try {
      const currentUser = await this.firebaseService.getCurrentUser();
      if (currentUser?.email) {
        this.referralData = await this.firebaseService.getReferralStats(
          currentUser.email
        );
      }
    } catch (error) {
      console.error('Error loading referral stats:', error);
    } finally {
      this.loading = false;
    }
  }
}
