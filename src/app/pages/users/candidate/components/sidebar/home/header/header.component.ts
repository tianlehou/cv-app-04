import { Component, EventEmitter, OnInit, Output } from '@angular/core';

@Component({
  selector: 'app-header',
  standalone: true,
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit {
  @Output() startNow = new EventEmitter<void>();

  constructor() { }

  ngOnInit(): void {
  }

  scrollTo(sectionId: string): void {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      // Close the menu after clicking a link on mobile
      this.closeMenu();
    }
  }

  isMenuOpen = false;

  toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
    const navLinks = document.querySelector('.nav-links');
    const hamburger = document.querySelector('.hamburger');
    
    if (navLinks && hamburger) {
      if (this.isMenuOpen) {
        navLinks.classList.add('active');
        // Small delay to allow the display: flex to take effect
        setTimeout(() => {
          navLinks.classList.add('visible');
        }, 10);
      } else {
        navLinks.classList.remove('visible');
        // Wait for the animation to complete before hiding the element
        setTimeout(() => {
          if (!this.isMenuOpen) {
            navLinks.classList.remove('active');
          }
        }, 1000); // Match this with the CSS transition duration
      }
      hamburger.classList.toggle('active');
    }
  }

  closeMenu(): void {
    if (!this.isMenuOpen) return;
    
    this.isMenuOpen = false;
    const navLinks = document.querySelector('.nav-links');
    const hamburger = document.querySelector('.hamburger');
    
    if (navLinks && hamburger) {
      navLinks.classList.remove('visible');
      hamburger.classList.remove('active');
      
      // Wait for the animation to complete before hiding the element
      setTimeout(() => {
        if (!this.isMenuOpen) {
          navLinks.classList.remove('active');
        }
      }, 500); // Match this with the CSS transition duration
    }
  }

  onStartNow(): void {
    this.startNow.emit();
  }
}
