import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-business-filters',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './business-filters.component.html',
  styleUrls: ['./business-filters.component.css']
})
export class BusinessFiltersComponent {
  @Input() searchQuery: string = '';
  @Output() filtersApplied = new EventEmitter<{
    searchQuery: string;
    advancedFilters: {
      direccion?: string;
      profesion?: string;
      habilidades?: string;
      idiomas?: string;
    }
  }>();

  showAdvancedFilters = false;
  advancedFilters = {
    direccion: '',
    profesion: '',
    habilidades: '',
    idiomas: ''
  };

  applyFilters() {
    this.filtersApplied.emit({
      searchQuery: this.searchQuery,
      advancedFilters: this.advancedFilters
    });
  }

  toggleAdvancedFilters() {
    this.showAdvancedFilters = !this.showAdvancedFilters;
  }

  clearAdvancedFilters() {
    this.advancedFilters = {
      direccion: '',
      profesion: '',
      habilidades: '',
      idiomas: ''
    };
    this.applyFilters();
  }
}