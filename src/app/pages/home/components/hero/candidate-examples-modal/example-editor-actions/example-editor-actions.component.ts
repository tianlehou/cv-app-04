import { Component, Output, EventEmitter } from '@angular/core';
import { ConfirmationModalService } from 'src/app/shared/components/confirmation-modal/confirmation-modal.service';
import { inject } from '@angular/core';

@Component({
  selector: 'app-example-editor-actions',
  standalone: true,
  templateUrl: './example-editor-actions.component.html',
  styleUrls: ['./example-editor-actions.component.css']
})
export class ExampleEditorActionsComponent {
  @Output() addExample = new EventEmitter<void>();
  @Output() deleteExample = new EventEmitter<void>();
  
  private confirmationModalService = inject(ConfirmationModalService);

  onAddExample() {
    this.addExample.emit();
  }

  onDeleteExample() {
    this.confirmationModalService.show(
      {
        title: 'Eliminar Ejemplo',
        message: '¿Estás seguro de que deseas eliminar este ejemplo?'
      },
      () => this.deleteExample.emit()
    );
  }
}
