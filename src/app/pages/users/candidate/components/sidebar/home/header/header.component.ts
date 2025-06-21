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
    }
  }

  toggleMenu(): void {
    const navLinks = document.querySelector('.nav-links');
    const hamburger = document.querySelector('.hamburger');
    if (navLinks && hamburger) {
      navLinks.classList.toggle('active');
      hamburger.classList.toggle('active');
    }
  }

  onStartNow(): void {
    this.startNow.emit();
  }
}
