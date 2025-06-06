import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-filters',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './filters.component.html',
  styleUrls: ['./filters.component.css']
})
export class FiltersComponent {
  @Input() userTypeFilter: string = 'all';
  @Input() searchQuery: string = '';
  
  @Output() filtersApplied = new EventEmitter<{
    userTypeFilter: string;
    searchQuery: string;
  }>();

  // Lista de tipos de usuario
  userTypes: string[] = ['all', 'candidate', 'business'];
  applyFilters() {
    this.filtersApplied.emit({
      userTypeFilter: this.userTypeFilter,
      searchQuery: this.searchQuery
    });
  }

  // Método para manejar el cambio del input de búsqueda
  onSelectChange() {
    this.applyFilters();
  }
}