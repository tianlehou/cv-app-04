import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-personal-data-info',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './personal-data-info.component.html',
  styleUrls: ['./personal-data-info.component.css']
})
export class PersonalDataInfoComponent {
  @Output() back = new EventEmitter<void>();

  goBack(): void {
    this.back.emit();
  }
}