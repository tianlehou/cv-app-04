import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-refer-filters',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './refer-filters.component.html',
  styleUrls: ['./refer-filters.component.css']
})
export class ReferFiltersComponent {
  @Input() userTypeFilter: string = 'all';
  @Input() searchQuery: string = '';
  
  @Output() filtersApplied = new EventEmitter<{
    userTypeFilter: string;
    searchQuery: string;
  }>();

  applyFilters() {
    this.filtersApplied.emit({
      userTypeFilter: this.userTypeFilter,
      searchQuery: this.searchQuery
    });
  }
}