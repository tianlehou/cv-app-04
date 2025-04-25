import { Component, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'app-delete-button-b',
  standalone: true,
  templateUrl: './delete-button.component.html',
  styleUrls: ['./delete-button.component.css']
})
export class DeleteButtonBComponent {
  @Output() deleteClick = new EventEmitter<Event>();

  onClick(event: Event) {
    event.preventDefault();
    this.deleteClick.emit(event);
  }
}