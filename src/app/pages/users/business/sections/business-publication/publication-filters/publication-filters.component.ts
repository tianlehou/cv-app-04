import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { JobOffer } from '../job-offer.model';

type PublicationStatus = 'all' | 'published' | 'draft' | 'expired';

interface StatusCounts {
  all: number;
  published: number;
  draft: number;
  expired: number;
  cancelled: number;
}

@Component({
  selector: 'app-publication-filters',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './publication-filters.component.html',
  styleUrls: ['./publication-filters.component.css']
})
export class PublicationFiltersComponent {
  @Output() filteredOffers = new EventEmitter<JobOffer[]>();
  @Input() statusCounts: StatusCounts = {
    all: 0,
    published: 0,
    draft: 0,
    expired: 0,
    cancelled: 0
  };
  
  @Input() allOffers: JobOffer[] = []; // Add this input to receive all offers
  activeFilter: PublicationStatus = 'all';

  selectFilter(filter: PublicationStatus): void {
    this.activeFilter = filter;
    this.applyFilter(this.allOffers); // Apply filter immediately when selection changes
  }

  filterOffers(allOffers: JobOffer[], status: PublicationStatus): JobOffer[] {
    // Filter offers based on status
    const offers = status === 'all' 
      ? allOffers 
      : allOffers.filter(offer => {
          if (status === 'published') return offer.status === 'publicado';
          if (status === 'draft') return offer.status === 'borrador';
          if (status === 'expired') return offer.status === 'vencido' || offer.status === 'cancelado';
          return true;
        });
        
    // Sort offers
    return offers.sort((a, b) => {
      const statusOrder: { [key: string]: number } = {
        'borrador': 0,
        'publicado': 1,
        'cancelado': 2,
        'vencido': 3
      };

      const orderA = statusOrder[a.status] ?? 4;
      const orderB = statusOrder[b.status] ?? 4;

      if (orderA === orderB) {
        let dateA: number;
        let dateB: number;

        if (a.status === 'borrador') {
          dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        } else if (a.status === 'publicado' || a.status === 'vencido') {
          dateA = a.deadline ? new Date(a.deadline).getTime() : 0;
          dateB = b.deadline ? new Date(b.deadline).getTime() : 0;
        } else if (a.status === 'cancelado') {
          dateA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
          dateB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
        } else {
          dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        }

        return dateB - dateA;
      }

      return orderA - orderB;
    });
  }

  applyFilter(allOffers: JobOffer[]): void {
    const filtered = this.filterOffers(allOffers, this.activeFilter);
    this.filteredOffers.emit(filtered);
  }
}