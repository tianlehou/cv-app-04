import { Component, OnInit, OnDestroy, ChangeDetectorRef, Optional, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-watermark',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './watermark.component.html',
  styleUrls: ['./watermark.component.css'] // Si no tienes estilos específicos, puedes omitir esto o crear un archivo CSS
})
export class WatermarkComponent implements OnInit, OnDestroy {
  @Input() initialPosition: string = 'bottom-right'; // Posición inicial opcional

  private readonly watermarkPositions = [
    'top-1',
    'top-2',
    'center',
    'bottom-2',
    'bottom-1',
  ];
  position: string = this.initialPosition;
  opacity: number = 0.7;
  private watermarkInterval: any;

  constructor(@Optional() private cdr?: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.position = this.initialPosition; // Establece la posición inicial desde el input
    this.startWatermarkRotation();
  }

  ngOnDestroy(): void {
    this.clearWatermarkInterval();
  }

  private startWatermarkRotation(): void {
    this.watermarkInterval = setInterval(() => {
      const currentIndex = this.watermarkPositions.indexOf(this.position);
      const nextIndex = (currentIndex + 1) % this.watermarkPositions.length;
      this.position = this.watermarkPositions[nextIndex];
      this.opacity = 0.6 + Math.random() * 0.3;
      if (this.cdr) {
        this.cdr.detectChanges();
      }
    }, 3000);
  }

  private clearWatermarkInterval(): void {
    if (this.watermarkInterval) {
      clearInterval(this.watermarkInterval);
    }
  }
}