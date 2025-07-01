import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-profile-picture-info',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './profile-picture-info.component.html',
  styleUrls: ['./profile-picture-info.component.css']
})
export class ProfilePictureInfoComponent {
  @Output() back = new EventEmitter<void>();

  goBack(): void {
    this.back.emit();
  }
}