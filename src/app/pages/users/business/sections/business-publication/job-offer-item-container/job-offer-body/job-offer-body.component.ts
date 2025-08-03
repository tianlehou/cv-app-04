import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  getFullText, 
  getPreviewText, 
  isTextLong, 
  getModalityLabel, 
  getContractTypeLabel, 
  getWorkdayLabel 
} from 'src/app/shared/utils/text.utils';

@Component({
  selector: 'app-job-offer-body',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './job-offer-body.component.html',
  styleUrls: ['./job-offer-body.component.css']
})
export class JobOfferBodyComponent {
  @Input() jobOffer: any;
  @Input() showFullDescription = false;
  @Input() showFullRequirements = false;

  @Output() toggleDescription = new EventEmitter<MouseEvent>();
  @Output() toggleRequirements = new EventEmitter<MouseEvent>();

  public getFullText = getFullText;
  public getPreviewText = getPreviewText;
  public isTextLong = isTextLong;
  public getModalityLabel = getModalityLabel;
  public getContractTypeLabel = getContractTypeLabel;
  public getWorkdayLabel = getWorkdayLabel;

  // Propiedad para el listener de clic
  private clickListener: (() => void) | null = null;

  // Manejar clic en ver más/menos
  toggleShowMore(section: 'description' | 'requirements', event: MouseEvent): void {
    event.stopPropagation();

    if (section === 'description') {
      this.showFullDescription = !this.showFullDescription;
    } else {
      this.showFullRequirements = !this.showFullRequirements;
    }

    // Configurar listener para cerrar al hacer clic fuera
    this.setupOutsideClickListener();
  }

  // Configurar listener para cerrar al hacer clic fuera
  private setupOutsideClickListener(): void {
    // Remover listener anterior si existe
    this.removeOutsideClickListener();

    // Agregar nuevo listener
    this.clickListener = () => {
      this.showFullDescription = false;
      this.showFullRequirements = false;
      this.removeOutsideClickListener();
    };

    // Usar setTimeout para evitar que el clic actual active el listener
    setTimeout(() => {
      document.addEventListener('click', this.clickListener!);
    }, 0);
  }

  // Remover listener de clic fuera del componente
  private removeOutsideClickListener(): void {
    if (this.clickListener) {
      document.removeEventListener('click', this.clickListener);
      this.clickListener = null;
    }
  }

    // Métodos para manejar los eventos de clic
  onToggleDescription(event: MouseEvent): void {
    event.stopPropagation();
    this.toggleDescription.emit(event);
  }

  onToggleRequirements(event: MouseEvent): void {
    event.stopPropagation();
    this.toggleRequirements.emit(event);
  }
}
