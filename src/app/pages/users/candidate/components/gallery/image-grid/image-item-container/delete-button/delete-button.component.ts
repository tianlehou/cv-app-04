import { Component, EventEmitter, Output, inject } from '@angular/core';
import { ConfirmationModalService } from '../../../../../../../../../shared/services/confirmation-modal.service';

@Component({
  selector: 'app-delete-button',
  standalone: true,
  templateUrl: './delete-button.component.html',
  styleUrls: ['./delete-button.component.css']
})
export class DeleteButtonComponent {
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