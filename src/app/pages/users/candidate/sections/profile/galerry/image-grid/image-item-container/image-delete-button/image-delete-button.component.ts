import { Component, EventEmitter, Output, inject } from '@angular/core';
import { ConfirmationModalService } from 'src/app/shared/services/confirmation-modal.service';

@Component({
  selector: 'app-image-delete-button',
  standalone: true,
  templateUrl: './image-delete-button.component.html',
  styleUrls: ['./image-delete-button.component.css']
})
export class ImageDeleteButtonComponent {
  @Output() deleteConfirmed = new EventEmitter<void>();
  private ConfirmationModalService = inject(ConfirmationModalService);

  showDeleteModal() {
    this.ConfirmationModalService.show(
      {
        title: 'Eliminar Imagen',
        message: '¿Estás seguro de que deseas eliminar esta imagen?'
      },
      () => this.deleteConfirmed.emit()
    );
  }
}