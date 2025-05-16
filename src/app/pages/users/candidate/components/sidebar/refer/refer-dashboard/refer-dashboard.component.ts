import {
  Component,
  OnInit,
  EnvironmentInjector,
  inject,
  runInInjectionContext,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReferralService } from '../referral.service';
import { FirebaseService } from 'src/app/shared/services/firebase.service';
import { ReferStatsGridComponent } from './components/refer-stats-grid/refer-stats-grid.component';
import { ref, get, update } from '@angular/fire/database';
import { ReferFiltersComponent } from './components/refer-filters/refer-filters.component';
import { ReferUserTableComponent } from './components/refer-user-table/refer-user-table.component';
import { ReferPaginationComponent } from './components/refer-pagination/refer-pagination.component';
import { ReferralRewardsComponent } from './components/referral-rewards/referral-rewards.component';
// import { ReferralPerformanceChartComponent } from './components/referral-performance-chart/referral-performance-chart.component';

@Component({
  selector: 'app-refer-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReferStatsGridComponent,
    ReferFiltersComponent,
    ReferUserTableComponent,
    ReferPaginationComponent,
    ReferralRewardsComponent,
    // ReferralPerformanceChartComponent,
  ],
  templateUrl: './refer-dashboard.component.html',
  styleUrls: ['./refer-dashboard.component.css'],
})
export class ReferDashboardComponent implements OnInit {
  // Datos combinados (usuarios y referidos)
  users: any[] = [];
  referrals: any[] = [];
  filteredUsers: any[] = [];

  // Estadísticas combinadas
  stats = {
    currentReferrals: 0,
    subscribedReferrals: 0
  };

  // Filtros
  userTypeFilter = 'all';
  searchQuery = '';
  timeFilter = 'all';
  statusFilter = 'all';

  // Paginación
  currentPage = 1;
  pageSize = 5;
  private injector = inject(EnvironmentInjector);

  constructor(
    private firebaseService: FirebaseService,
    private referralService: ReferralService
  ) { }

  async ngOnInit() {
    await this.loadReferralData();
    this.applyFilters();
  }

  async loadUsers() {
    const usersRef = ref(this.firebaseService['db'], 'cv-app/users');
    const snapshot = await get(usersRef);
    this.users = [];

    if (snapshot.exists()) {
      const usersObject = snapshot.val();
      this.users = await Promise.all(
        Object.keys(usersObject).map(async (userKey) => {
          const userData = usersObject[userKey];
          const metadata = userData.metadata || {};

          return {
            key: userKey,
            email: metadata.email || '',
            fullName: userData?.profileData?.personalData?.fullName || '',
            role: metadata.role || 'candidate',
            enabled: metadata.enabled !== undefined ? metadata.enabled : true,
            ...userData,
            createdAt: metadata.createdAt ? new Date(metadata.createdAt) : null,
            lastLogin: metadata.lastLogin ? new Date(metadata.lastLogin) : null,
          };
        })
      );
    }
  }

  async loadReferralData() {
    return runInInjectionContext(this.injector, async () => {
      const currentUser = await this.firebaseService.getCurrentUser();
      if (currentUser?.metadata?.userId) {
        try {
          const stats = await this.referralService.getReferralStats(
            currentUser.metadata.userId
          );

          this.stats.currentReferrals = stats.referrals.length;
          this.stats.subscribedReferrals = stats.referrals
            .filter(r => r.subscriptionAmount > 0)
            .reduce((sum, r) => sum + r.subscriptionAmount, 0);

          this.referrals = stats.referrals.map(ref => ({
            email: ref.email,
            fullName: ref.fullName || 'N/A',
            subscriptionAmount: ref.subscriptionAmount || 0.00,
            date: new Date(ref.timestamp).toLocaleDateString('es-ES'),
          }));
        } catch (error) {
          console.error('Error loading referral data:', error);
        }
      }
    });
  }

  applyFilters() {
    this.filteredUsers = this.referrals.filter((referral) => {
      const matchesSearch =
        referral.email.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        (referral.fullName?.toLowerCase() || '').includes(
          this.searchQuery.toLowerCase()
        );
      return matchesSearch;
    });
    this.currentPage = 1;
  }

  onFiltersApplied(filters: { userTypeFilter: string; searchQuery: string }) {
    this.userTypeFilter = filters.userTypeFilter;
    this.searchQuery = filters.searchQuery;
    this.applyFilters();
  }

  get paginatedUsers(): any[] {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    return this.filteredUsers.slice(startIndex, startIndex + this.pageSize);
  }

  onPageChange(page: number): void {
    this.currentPage = page;
  }

  formatDate(date: Date | null): string {
    return date
      ? date.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
      : 'Nunca';
  }
}
