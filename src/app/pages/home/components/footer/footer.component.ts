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
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.css']
})
export class FooterComponent {
  currentYear = new Date().getFullYear();

  socialLinks = [
    { name: 'facebook', url: '#' },
    { name: 'twitter', url: '#' },
    { name: 'instagram', url: '#' },
    { name: 'linkedin', url: '#' }
  ];

  footerColumns: FooterColumn[] = [
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
        { text: 'tianlehou1983@gmail.com', url: 'mailto:tianlehou1983@gmail.com', icon: 'mail-outline' },
        { text: '+507 6843-0240', url: 'https://wa.me/50768430240', icon: 'logo-whatsapp' }
      ]
    }
  ];
}
