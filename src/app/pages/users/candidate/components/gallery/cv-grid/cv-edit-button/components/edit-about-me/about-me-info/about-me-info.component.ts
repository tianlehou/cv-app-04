import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-about-me-info',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './about-me-info.component.html',
  styleUrls: ['./about-me-info.component.css']
})
export class AboutMeInfoComponent {
  @Output() back = new EventEmitter<void>();

  goBack(): void {
    this.back.emit();
  }
}