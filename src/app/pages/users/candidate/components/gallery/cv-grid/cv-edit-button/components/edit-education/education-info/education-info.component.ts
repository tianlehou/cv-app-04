import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-education-info',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './education-info.component.html',
  styleUrls: ['./education-info.component.css']
})
export class EducationInfoComponent {
  @Output() back = new EventEmitter<void>();

  goBack(): void {
    this.back.emit();
  }
}