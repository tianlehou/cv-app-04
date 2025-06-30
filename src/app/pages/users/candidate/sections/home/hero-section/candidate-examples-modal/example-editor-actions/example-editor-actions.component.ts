import { Component, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-example-editor-actions',
  standalone: true,
  templateUrl: './example-editor-actions.component.html',
  styleUrls: ['./example-editor-actions.component.css']
})
export class ExampleEditorActionsComponent {
  @Output() addExample = new EventEmitter<void>();
  @Output() deleteExample = new EventEmitter<void>();

  onAddExample() {
    this.addExample.emit();
  }

  onDeleteExample() {
    this.deleteExample.emit();
  }
}
