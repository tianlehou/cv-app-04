import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-cv-edit-button-row',
  imports: [CommonModule],
  templateUrl: './cv-edit-button-row.component.html',
  styleUrl: './cv-edit-button-row.component.css'
})
export class CvEditButtonRowComponent {
  @Input() isEditing: boolean = false;
  @Input() hasChanges: boolean = false;
  @Output() onCancel = new EventEmitter<void>();
  @Output() onEditSave = new EventEmitter<void>();
  @Output() onAdd = new EventEmitter<void>();

  handleAddClick(event: Event): void {
    event.preventDefault(); // Previene el submit del formulario
    this.onAdd.emit();
  }
}