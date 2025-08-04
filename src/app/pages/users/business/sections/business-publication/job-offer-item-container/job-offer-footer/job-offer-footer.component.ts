import { CommonModule } from '@angular/common';
import { Component, Input, Output, EventEmitter, OnDestroy, OnInit, NgZone } from '@angular/core';
import { interval, Subscription } from 'rxjs';

@Component({
  selector: 'app-job-offer-footer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './job-offer-footer.component.html',
  styleUrls: ['./job-offer-footer.component.css']
})
export class JobOfferFooterComponent implements OnInit, OnDestroy {
  @Input() jobOffer: any;
  @Input() likesCount: number = 0;
  @Input() bookmarksCount: number = 0;
  @Input() sharesCount: number = 0;
  @Input() applicationsCount: number = 0;
  
  @Output() viewApplicants = new EventEmitter<void>();

  // Estado para el tiempo restante
  timeRemaining: string = '';
  isTimeCritical: boolean = false;
  private countdownSub: Subscription | null = null;
  private timeZone = 'America/Panama';

  constructor(private ngZone: NgZone) {}

  ngOnInit(): void {
    this.updateTimeRemaining();
    // Actualizar cada segundo
    this.countdownSub = interval(1000).subscribe(() => {
      this.updateTimeRemaining();
    });
  }

  onViewApplicants(): void {
    this.viewApplicants.emit();
  }

  // Método para formatear números según los requisitos
  formatNumber(value: number): string {
    if (value === null || value === undefined) return '0';
    
    // Para números menores a 1000, mostrarlos completos
    if (value < 1000) {
      return value.toString();
    }
    
    // Para números entre 1,000 y 999,999
    if (value < 1000000) {
      const formatted = (value / 1000).toFixed(1);
      return `${formatted}K`;
    }
    
    // Para números entre 1,000,000 y 999,999,999
    if (value < 1000000000) {
      const formatted = (value / 1000000).toFixed(1);
      return `${formatted}M`;
    }

    // Para números de 1,000,000 en adelante
    const formatted = (value / 1000000000).toFixed(1);
    return `${formatted}B`;
  }

  private updateTimeRemaining() {
    if (!this.jobOffer?.deadline) {
      this.timeRemaining = '';
      this.isTimeCritical = false;
      return;
    }

    const now = new Date();
    // Ajustar 5 horas a la fecha actual
    now.setHours(now.getHours() - 5);

    const deadline = new Date(this.jobOffer.deadline);

    // Asegurarse de que estamos comparando en la misma zona horaria
    const nowPanama = new Date(now.toLocaleString('en-US', { timeZone: this.timeZone }));
    const deadlinePanama = new Date(deadline.toLocaleString('en-US', { timeZone: this.timeZone }));

    const diffMs = deadlinePanama.getTime() - nowPanama.getTime();
    const hoursDiff = diffMs / (1000 * 60 * 60); // Convertir a horas

    // Verificar si faltan menos de 24 horas o si ya expiró
    this.isTimeCritical = hoursDiff < 24 || diffMs <= 0;

    if (diffMs <= 0) {
      this.timeRemaining = 'Expirado';
      return;
    }

    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

    if (days > 0) {
      this.timeRemaining = `${days}d ${hours}h`;
    } else if (hours > 0) {
      this.timeRemaining = `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      this.timeRemaining = `${minutes}m ${seconds}s`;
    } else {
      this.timeRemaining = `${seconds}s`;
    }
  }

  ngOnDestroy(): void {
    if (this.countdownSub) {
      this.countdownSub.unsubscribe();
    }
  }
}
