import {
  Component,
  Input,
  OnChanges,
  SimpleChanges,
  ChangeDetectorRef,
  NgZone,
  inject,
} from '@angular/core';
import { CommonModule, NgStyle } from '@angular/common';
import { FileSizePipe } from '../../pipes/filesize.pipe';

@Component({
  selector: 'app-progress-bar',
  standalone: true,
  imports: [CommonModule, FileSizePipe, NgStyle],
  templateUrl: './progress-bar.component.html',
  styleUrl: './progress-bar.component.css',
})
export class ProgressBarComponent implements OnChanges {
  @Input() snapshot: any;

  uploadProgress: number | null = null;
  uploadedSize = 0;
  totalSize = 0;

  private cdr = inject(ChangeDetectorRef);
  private ngZone = inject(NgZone);

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['snapshot'] && this.snapshot) {
      this.updateProgress(this.snapshot);
    }
  }

  private updateProgress(snapshot: any): void {
    this.ngZone.run(() => {
      this.uploadedSize = snapshot.bytesTransferred;
      this.totalSize = snapshot.totalBytes;
      this.uploadProgress = Math.round(
        (snapshot.bytesTransferred / snapshot.totalBytes) * 100
      );
      this.cdr.detectChanges();
    });
  }
}
