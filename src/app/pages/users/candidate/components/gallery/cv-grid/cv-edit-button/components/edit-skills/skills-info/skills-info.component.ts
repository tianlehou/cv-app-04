import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-skills-info',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './skills-info.component.html',
  styleUrls: ['./skills-info.component.css']
})
export class SkillsInfoComponent {
  @Output() back = new EventEmitter<void>();

  goBack(): void {
    this.back.emit();
  }
}