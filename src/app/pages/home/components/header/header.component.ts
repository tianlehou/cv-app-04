import { Component, Output, EventEmitter, HostListener, Input } from '@angular/core';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent {
  @Output() loginClick = new EventEmitter<void>();
  @Output() candidateClick = new EventEmitter<void>();
  @Output() businessClick = new EventEmitter<void>();

  @Input() currentView: 'candidate' | 'business' = 'candidate';
  isMenuOpen = false;

  // Cerrar menú cuando se redimensiona la pantalla a un tamaño mayor
  @HostListener('window:resize', ['$event'])
  onResize(event: Event) {
    if (window.innerWidth > 768) {
      this.closeMenu();
    }
  }

  toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
  }

  closeMenu(): void {
    this.isMenuOpen = false;
  }

  onCandidateClick(): void {
    this.candidateClick.emit();
  }

  onLoginClick(): void {
    this.loginClick.emit();
  }

  onBusinessClick(): void {
    this.businessClick.emit();
  }
}