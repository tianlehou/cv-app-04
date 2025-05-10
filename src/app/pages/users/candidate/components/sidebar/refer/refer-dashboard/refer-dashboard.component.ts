// refer-dashboard.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FirebaseService } from '../../../../../../../shared/services/firebase.service';
import { ToastService } from '../../../../../../../shared/services/toast.service';

@Component({
  selector: 'app-refer-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './refer-dashboard.component.html',
  styleUrls: ['./refer-dashboard.component.css'],
})
export class ReferDashboardComponent implements OnInit {
  public stats = {
    totalReferrals: 0,
    activeReferrals: 0,
    conversionRate: 0,
    recentReferrals: [] as any[],
  };
  public isLoading = true;
  public currentUser: any;
  public hasError = false;

  constructor(
    private firebaseService: FirebaseService,
    private toastService: ToastService
  ) {}

  async ngOnInit() {
    try {
      this.currentUser = await this.firebaseService.getCurrentUser();
      if (!this.currentUser) {
        throw new Error('Usuario no autenticado');
      }

      if (this.currentUser?.metadata?.userId) {
        const stats = await this.firebaseService.getReferralStats(
          this.currentUser.metadata.userId
        );
        // Asegurar que recentReferrals siempre sea un array
        this.stats = {
          totalReferrals: stats?.totalReferrals || 0,
          activeReferrals: stats?.activeReferrals || 0,
          conversionRate: stats?.conversionRate || 0,
          recentReferrals: stats?.recentReferrals || [],
        };
      } else {
        throw new Error('ID de usuario no disponible');
      }
    } catch (error) {
      console.error('Error loading referral stats:', error);
      this.hasError = true;
      this.toastService.show(
        'Error al cargar estadísticas: ' +
          (error instanceof Error ? error.message : 'Error desconocido'),
        'error'
      );
    } finally {
      this.isLoading = false;
    }
  }
}
