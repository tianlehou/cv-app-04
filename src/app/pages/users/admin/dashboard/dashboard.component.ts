import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgxChartsModule } from '@swimlane/ngx-charts';
import { get, ref, update } from 'firebase/database';
import { FirebaseService } from '../../../../shared/services/firebase.service';
import { PaginationComponent } from './components/pagination/pagination.component';
import { StatsGridComponent } from './components/stats-grid/stats-grid.component';
import { FiltersComponent } from './components/filters/filters.component';
import { UserTableComponent } from './components/user-table/user-table.component';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, NgxChartsModule, PaginationComponent, StatsGridComponent, FiltersComponent, UserTableComponent,],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class AdminDashboardComponent implements OnInit {
  users: any[] = [];
  filteredUsers: any[] = [];
  userTypeFilter: string = 'all';
  searchQuery: string = '';

  // Estadísticas
  totalUsers: number = 0;
  totalCandidates: number = 0;
  totalCompanies: number = 0;

  // Paginación
  currentPage: number = 1;
  pageSize: number = 5;

  // Gráfico
  view: [number, number] = [700, 400];
  colorScheme = {
    domain: ['#5AA454', '#A10A28', '#C7B42C']
  };

  constructor(private firebaseService: FirebaseService) { }

  async ngOnInit() {
    await this.loadUsers();
    this.updateStats();
  }

  async loadUsers() {
    const usersRef = ref(this.firebaseService['db'], 'cv-app/users');
    const snapshot = await get(usersRef);
    this.users = [];
    
    if (snapshot.exists()) {
      // Obtener todos los usuarios como objeto
      const usersObject = snapshot.val();
      
      // Procesar cada usuario
      const userPromises = Object.keys(usersObject).map(async (userKey) => {
        const userData = usersObject[userKey];
        
        // Obtener metadatos
        const metadataRef = ref(this.firebaseService['db'], `cv-app/users/${userKey}/metadata`);
        const metadataSnapshot = await get(metadataRef);
        const metadata = metadataSnapshot.exists() ? metadataSnapshot.val() : {};
        
        return {
          key: userKey,
          ...userData,
          createdAt: metadata.createdAt ? new Date(metadata.createdAt) : null,
          lastLogin: metadata.lastLogin ? new Date(metadata.lastLogin) : null
        };
      });
      
      this.users = await Promise.all(userPromises);
    }
    
    this.applyFilters();
  }

  updateStats() {
    this.totalUsers = this.users.length;
    this.totalCandidates = this.users.filter(u => u.role === 'candidate').length;
    this.totalCompanies = this.users.filter(u => u.role === 'company').length;
  }

  applyFilters() {
    this.filteredUsers = this.users.filter(user => {
      const matchesType = this.userTypeFilter === 'all' ||
        user.role === this.userTypeFilter;
      const matchesSearch = user.email.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        user.fullName?.toLowerCase().includes(this.searchQuery.toLowerCase());
      return matchesType && matchesSearch;
    });
    this.currentPage = 1;
    this.updateStats();
  }

  async toggleUserStatus(user: any) {
    const updates = {
      enabled: !user.enabled,
      lastUpdated: new Date().toISOString()
    };

    await update(ref(this.firebaseService['db'], `cv-app/users/${user.key}`), updates);
    user.enabled = !user.enabled;
  }

  formatDate(date: Date | null): string {
    return date ? date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }) : 'Nunca';
  }

  // Métodos de paginación
  onPageChange(page: number): void {
    this.currentPage = page;
  }

  get paginatedUsers(): any[] {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    return this.filteredUsers.slice(startIndex, startIndex + this.pageSize);
  }

  // Método para manejar cambios en los filtros
  onFilterChange() {
    this.applyFilters();
  }

  onFiltersApplied(filters: { userTypeFilter: string; searchQuery: string }) {
    this.userTypeFilter = filters.userTypeFilter;
    this.searchQuery = filters.searchQuery;
    this.applyFilters(); // Tu método existente que filtra los usuarios
  }

  // Método para manejar el cambio de estado
  onStatusToggled(user: any) {
    this.toggleUserStatus(user);
  }
}