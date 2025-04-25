import { CommonModule } from '@angular/common';
import { Component, Output, EventEmitter, Input, inject } from '@angular/core';
import { ToastService } from '../../../../../../../shared/services/toast.service';
import { User } from '@angular/fire/auth';

@Component({
  selector: 'app-video-upload-button',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './video-upload-button.component.html',
  styleUrls: ['./video-upload-button.component.css'],
})
export class VideoUploadButtonComponent {
  @Input() userEmailKey: string | null = null;
  @Input() currentUser: User | null = null;
  @Output() fileSelected = new EventEmitter<File>();

  private toast = inject(ToastService);

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) {
      console.log('No files selected');
      return;
    }

    const file = input.files[0];
    console.log('File selected:', file.name, file.size);

    if (!file.type.startsWith('video/')) {
      this.toast.show(
        'Formato de archivo inválido. Solo se permiten videos.',
        'error'
      );
      input.value = '';
      return;
    }

    console.log('Emitting fileSelected event');
    this.fileSelected.emit(file);
  }
}
