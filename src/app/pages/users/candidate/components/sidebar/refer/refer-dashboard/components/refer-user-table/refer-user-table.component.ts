// user-table.component.ts
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-refer-user-table',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './refer-user-table.component.html',
  styleUrls: ['./refer-user-table.component.css']
})
export class ReferUserTableComponent {
  @Input() users: any[] = [];
  @Output() statusToggled = new EventEmitter<any>();

  formatDate(date: Date | null): string {
    return date ? date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }) : 'Nunca';
  }

  toggleUserStatus(user: any) {
    this.statusToggled.emit(user);
  }
}