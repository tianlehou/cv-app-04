import { Component, OnInit, EnvironmentInjector, inject, runInInjectionContext } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReferralService } from '../referral.service';
import { FirebaseService } from 'src/app/shared/services/firebase.service';
import { ReferStatsGridComponent } from './components/refer-stats-grid/refer-stats-grid.component';
import { ref, get, update } from 'firebase/database';
import { ReferFiltersComponent } from './components/refer-filters/refer-filters.component';
import { ReferUserTableComponent } from './components/refer-user-table/refer-user-table.component';
import { ReferPaginationComponent } from './components/refer-pagination/refer-pagination.component';
import { ReferralRewardsComponent } from './components/referral-rewards/referral-rewards.component';
import { ReferralPerformanceChartComponent } from './components/referral-performance-chart/referral-performance-chart.component';

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
    ReferralPerformanceChartComponent,
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
    totalUsers: 0,
    totalCandidates: 0,
    totalCompanies: 0,
    totalReferrals: 0,
    activeReferrals: 0,
    conversions: 0,
    rewardsEarned: 0,
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
  ) {}

  async ngOnInit() {
 await this.loadReferralData();
    this.updateStats();
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
          this.stats.totalReferrals = stats.count;
          this.stats.activeReferrals = stats.referrals.filter(
            (r) => r.converted
          ).length;
          this.stats.conversions = stats.referrals.length;
          this.stats.rewardsEarned = stats.count * 10;

          // Iterar sobre referidos para obtener fullName
          this.referrals = await Promise.all(stats.referrals.map(async (ref) => {
            const userInfo = await this.referralService.getUserBasicInfo(ref.emailKey);
            return {
              ...ref,
              fullName: userInfo?.fullName || 'N/A', // Agregar fullName
              converted: ref.converted ? 'Sí' : 'No',
              date: new Date(ref.timestamp).toLocaleDateString(),
            };
          }));
        } catch (error) {
          console.error('Error loading referral data:', error);
        }
      }
    });
  }

  updateStats() {
    this.stats.totalUsers = this.users.length;
    this.stats.totalCandidates = this.users.filter(
      (u) => u.role === 'candidate'
    ).length;
    this.stats.totalCompanies = this.users.filter(
      (u) => u.role === 'company'
    ).length;
  }

  applyFilters() {
    this.filteredUsers = this.users.filter((user) => {
      const matchesType =
        this.userTypeFilter === 'all' || user.role === this.userTypeFilter;
      const matchesSearch =
        user.email.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        user.fullName?.toLowerCase().includes(this.searchQuery.toLowerCase());
      return matchesType && matchesSearch;
    });
    this.currentPage = 1;
  }

  onFiltersApplied(filters: { userTypeFilter: string; searchQuery: string }) {
    this.userTypeFilter = filters.userTypeFilter;
    this.searchQuery = filters.searchQuery;
    this.applyFilters();
  }

  onStatusToggled(user: any) {
    this.toggleUserStatus(user);
  }

  async toggleUserStatus(user: any) {
    const updates = {
      enabled: !user.enabled,
      lastUpdated: new Date().toISOString(),
    };

    await update(
      ref(this.firebaseService['db'], `cv-app/users/${user.key}/metadata`),
      updates
    );
    user.enabled = !user.enabled;
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
