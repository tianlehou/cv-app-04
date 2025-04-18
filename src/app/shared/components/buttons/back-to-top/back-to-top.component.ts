import { Component, HostListener, Input } from '@angular/core';

@Component({
  selector: 'app-back-to-top',
  standalone: true,
  templateUrl: './back-to-top.component.html',
  styleUrls: ['./back-to-top.component.css']
})
export class BackToTopComponent {
  @Input() scrollableContainer?: HTMLElement;
  showButton = false;

  @HostListener('window:scroll')
  onWindowScroll() {
    if (this.scrollableContainer) {
      const containerRect = this.scrollableContainer.getBoundingClientRect();
      const containerBottom = containerRect.bottom;
      const windowHeight = window.innerHeight;
      this.showButton = containerBottom <= windowHeight + 100;
    } else {
      // Comportamiento por defecto para toda la página
      this.showButton = window.scrollY > 300;
    }
  }

  scrollToTop() {
    if (this.scrollableContainer) {
      this.scrollableContainer.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    } else {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
  }
}