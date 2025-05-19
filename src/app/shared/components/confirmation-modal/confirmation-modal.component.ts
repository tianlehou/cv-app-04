// confirmation-modal.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConfirmationModalService } from '../../services/confirmation-modal.service';

@Component({
  selector: 'app-confirmation-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './confirmation-modal.component.html',
  styleUrls: ['./confirmation-modal.component.css'],
})
export class ConfirmationModalComponent {
  constructor(public ConfirmationModalService: ConfirmationModalService) {}
}
