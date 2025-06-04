import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { get, ref, update } from 'firebase/database';
import { FirebaseService } from '../../../../shared/services/firebase.service';
import { BusinessStatsGridComponent } from './stats-grid/business-stats-grid.component';
import { BusinessFiltersComponent } from './filters/business-filters.component';
import { BusinessUserTableComponent } from './user-table/business-user-table.component';
import { BusinessPaginationComponent } from './pagination/business-pagination.component';

@Component({
  selector: 'app-business-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, BusinessStatsGridComponent, BusinessFiltersComponent, BusinessUserTableComponent, BusinessPaginationComponent],
  templateUrl: './business-dashboard.component.html',
  styleUrls: ['./business-dashboard.component.css']
})
export class BusinessDashboardComponent implements OnInit {
  users: any[] = [];
  filteredUsers: any[] = [];
  userTypeFilter: string = 'all';
  searchQuery: string = '';

  // Estadísticas
  totalUsers: number = 0;
  totalBusiness: number = 0;
  totalCandidates: number = 0;

  // Paginación
  currentPage: number = 1;
  pageSize: number = 10;

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
      const usersObject = snapshot.val();

      const userPromises = Object.keys(usersObject).map(async (userKey) => {
        const userData = usersObject[userKey];

        const metadataRef = ref(this.firebaseService['db'], `cv-app/users/${userKey}/metadata`);
        const metadataSnapshot = await get(metadataRef);
        const metadata = metadataSnapshot.exists() ? metadataSnapshot.val() : {};

        // Solo procesar usuarios con rol 'candidate'
        if (metadata.role === 'candidate') {
          return {
            key: userKey,
            fullName: userData?.profileData?.personalData?.fullName || '',
            email: metadata.email || '',
            profesion: userData?.profileData?.personalData?.profesion || '',
            role: metadata.role || 'candidate',
            profileData: {
              ...userData?.profileData,
              multimedia: {
                ...userData?.profileData?.multimedia,
                picture: {
                  profilePicture: userData?.profileData?.multimedia?.picture?.profilePicture || null
                }
              }
            },
          };
        }
        return null; // Retornar null para usuarios no candidatos
      });

      const allUsers = await Promise.all(userPromises);
      // Filtrar los nulls (usuarios no candidatos)
      this.users = allUsers.filter(user => user !== null);
    }

    this.applyFilters();
  }

  updateStats() {
    this.totalUsers = this.users.length;
    this.totalBusiness = 0;
    this.totalCandidates = this.users.length;
  }

  applyFilters(searchParams?: { searchQuery: string, advancedFilters: any }) {
    const normalize = (str: string | undefined | null): string => {
      if (!str) return ''; // Maneja undefined, null o string vacío
      return str.toString().normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    };

    const searchTerm = normalize(searchParams?.searchQuery || this.searchQuery);
    const advFilters = searchParams?.advancedFilters || {};

    this.filteredUsers = this.users.filter(user => {
      // Búsqueda básica
      const matchesSearch = searchTerm === '' ||
        normalize(user.email).includes(searchTerm) ||
        normalize(user.fullName).includes(searchTerm);

      // Filtros avanzados
      const matchesDireccion = advFilters.direccion === '' ||
        normalize(user.profileData?.personalData?.direction).includes(normalize(advFilters.direccion));

      const matchesProfesion = advFilters.profesion === '' ||
        normalize(user.profesion).includes(normalize(advFilters.profesion));

      const matchesHabilidades = advFilters.habilidades === '' ||
        normalize(user.profileData?.skills).includes(normalize(advFilters.habilidades));

      const matchesIdiomas = advFilters.idiomas === '' ||
        normalize(user.profileData?.languages).includes(normalize(advFilters.idiomas));

      return matchesSearch && matchesDireccion && matchesProfesion &&
        matchesHabilidades && matchesIdiomas;
    });

    this.currentPage = 1;
    this.updateStats();
  }

  onFiltersApplied(filters: { searchQuery: string, advancedFilters: any }) {
    this.searchQuery = filters.searchQuery;
    this.applyFilters(filters);
  }

  async toggleUserStatus(user: any) {
    const updates = {
      enabled: !user.enabled,
      lastUpdated: new Date().toISOString()
    };

    await update(ref(this.firebaseService['db'], `cv-app/users/${user.key}/metadata`), updates);
    user.enabled = !user.enabled;
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



  // Método para manejar el cambio de estado
  onStatusToggled(user: any) {
    this.toggleUserStatus(user);
  }
}