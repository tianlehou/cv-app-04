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
  
  @Output() filtersApplied = new EventEmitter<string>();

  applyFilters() {
    this.filtersApplied.emit(this.searchQuery);
  }
}