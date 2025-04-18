import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-languages-info',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './languages-info.component.html',
  styleUrls: ['./languages-info.component.css']
})
export class LanguagesInfoComponent {
  @Output() back = new EventEmitter<void>();

  goBack(): void {
    this.back.emit();
  }
}