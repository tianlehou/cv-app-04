// call-to-action.component.ts
import { Component, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-call-to-action',
  standalone: true,
  imports: [],
  templateUrl: './call-to-action.component.html',
  styleUrl: './call-to-action.component.css'
})
export class CallToActionComponent {
  @Output() registerClicked = new EventEmitter<void>();

  onRegisterClick() {
    this.registerClicked.emit();
  }
}