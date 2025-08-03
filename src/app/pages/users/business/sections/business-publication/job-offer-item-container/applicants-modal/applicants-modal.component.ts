import { Component, EventEmitter, Input, Output, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApplicantsService } from '../../services/applicants.service';
import { finalize } from 'rxjs/operators';
import { BusinessCandidateProfileModalComponent } from '../../../../sections/business-dashboard/user-table/candidate-profile-modal/business-candidate-profile-modal.component';

@Component({
  selector: 'app-applicants-modal',
  standalone: true,
  imports: [CommonModule, BusinessCandidateProfileModalComponent],
  templateUrl: './applicants-modal.component.html',
  styleUrls: ['./applicants-modal.component.css']
})
export class ApplicantsModalComponent implements OnChanges {
  @Input() isOpen = false;
  @Input() jobOfferId: string = '';
  @Input() companyId: string = '';
  @Input() jobOffer: any;
  @Output() closeModal = new EventEmitter<void>();
  
  applicants: any[] = [];
  pagedApplicants: any[] = [];
  isLoading = true;
  currentPage = 1;
  pageSize = 10;
  
  // Para el modal de perfil
  selectedApplicant: any = null;
  
  constructor(private applicantsService: ApplicantsService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen']?.currentValue === true && this.jobOfferId && this.companyId) {
      this.loadApplicants();
    }
  }

  onClose() {
    this.closeModal.emit();
  }

  private loadApplicants(): void {
    if (!this.jobOfferId || !this.companyId) {
      this.isLoading = false;
      return;
    }

    this.isLoading = true;
    this.applicantsService.getApplicants(this.jobOfferId, this.companyId)
      .pipe(
        finalize(() => this.isLoading = false)
      )
      .subscribe({
        next: (applicants) => {
          this.applicants = applicants || [];
          this.updatePagedApplicants();
        },
        error: (error) => {
          console.error('Error al cargar los postulantes:', error);
          this.applicants = [];
          this.updatePagedApplicants();
        }
      });
  }

  /**
   * Actualiza la lista paginada de postulantes
   */
  private updatePagedApplicants(): void {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    this.pagedApplicants = this.applicants.slice(startIndex, startIndex + this.pageSize);
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.updatePagedApplicants();
  }

  viewProfile(applicant: any): void {
    this.selectedApplicant = applicant;
  }

  // Cierra el modal de perfil
  closeProfileModal(): void {
    this.selectedApplicant = null;
  }
  
  // Evita que el clic en el contenido del modal cierre el modal
  onModalClick(event: Event) {
    event.stopPropagation();
  }
  
  // Obtiene la clase CSS según el estado del postulante
  getStatusClass(status: string): string {
    switch (status?.toLowerCase()) {
      case 'pending':
        return 'status-pending';
      case 'reviewed':
        return 'status-reviewed';
      case 'interview':
      case 'interview_scheduled':
        return 'status-interview';
      case 'rejected':
        return 'status-rejected';
      case 'hired':
        return 'status-hired';
      default:
        return 'status-pending';
    }
  }
  
  // Obtiene el texto legible del estado
  getStatusText(status: string): string {
    if (!status) return 'Pendiente';
    
    const statusMap: { [key: string]: string } = {
      'pending': 'Pendiente',
      'reviewed': 'Revisado',
      'interview': 'Entrevista',
      'interview_scheduled': 'Entrevista agendada',
      'rejected': 'Rechazado',
      'hired': 'Contratado'
    };
    
    return statusMap[status.toLowerCase()] || status;
  }
  
  // Formatea la fecha para mostrarla de manera legible
  formatDate(date: Date | string): string {
    if (!date) return 'N/A';
    const d = new Date(date);
    return d.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}
