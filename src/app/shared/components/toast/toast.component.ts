import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService, ToastType } from '../../services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './toast.component.html',
  styleUrls: ['./toast.component.css']
})
export class ToastComponent {
  constructor(public toastService: ToastService) {}

  getIcon(type: ToastType): string {
    const icons = {
      success: 'check-circle',
      error: 'times-circle',
      info: 'info-circle',
      warning: 'exclamation-circle'
    };
    return `fas fa-${icons[type]}`;
  }
}