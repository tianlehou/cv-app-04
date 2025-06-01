// user-table.component.ts
import { Component, Input, Output, EventEmitter, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CandidateProfileModalComponent } from './candidate-profile-modal/candidate-profile-modal.component';

@Component({
  selector: 'app-user-table',
  standalone: true,
  imports: [CommonModule, CandidateProfileModalComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './user-table.component.html',
  styleUrls: ['./user-table.component.css']
})
export class UserTableComponent {
  @Input() users: any[] = [];
  @Input() currentPage: number = 1; // Añade este input
  @Input() pageSize: number = 10;    // Añade este input
  @Output() statusToggled = new EventEmitter<any>();
  selectedUser: any = null;

  openCandidateProfile(user: any) {
    this.selectedUser = user;
  }

  closeCandidateProfile() {
    this.selectedUser = null;
  }
  
  formatDate(date: Date | null): string {
    return date ? date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }) : 'Nunca';
  }

  toggleUserStatus(user: any) {
    this.statusToggled.emit(user);
  }
}