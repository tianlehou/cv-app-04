import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';

interface FooterLink {
  text: string;
  url: string;
  icon?: string;
}

interface FooterColumn {
  title: string;
  links: FooterLink[];
}

@Component({
  selector: 'app-footer-section',
  standalone: true,
  imports: [CommonModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './footer-section.component.html',
  styleUrls: ['./footer-section.component.css']
})
export class FooterSectionComponent {
  currentYear = new Date().getFullYear();

  socialLinks = [
    { name: 'facebook', url: '#' },
    { name: 'twitter', url: '#' },
    { name: 'instagram', url: '#' },
    { name: 'linkedin', url: '#' }
  ];

  footerColumns: FooterColumn[] = [
    {
      title: 'Enlaces',
      links: [
        { text: 'Inicio', url: '#' },
        { text: 'Beneficios', url: '#features' },
        { text: 'Cómo funciona', url: '#how-it-works' },
        { text: 'Testimonios', url: '#testimonials' }
      ]
    },
    {
      title: 'Legal',
      links: [
        { text: 'Términos y condiciones', url: '#' },
        { text: 'Política de privacidad', url: '#' },
        { text: 'Cookies', url: '#' }
      ]
    },
    {
      title: 'Contacto',
      links: [
        { text: 'hola@talentovisual.com', url: 'mailto:hola@talentovisual.com', icon: 'mail-outline' },
        { text: '+1 234 567 890', url: 'tel:+1234567890', icon: 'call-outline' }
      ]
    }
  ];
}
