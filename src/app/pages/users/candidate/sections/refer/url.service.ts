import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class UrlService {
  private readonly baseUrls = {
    localhost: 'http://localhost:4200',
    production: 'https://cv-app.vercel.app',
    demo2: 'https://cv-app-02.vercel.app',
    demo4: 'https://cv-app-04.vercel.app'
  };

  getBaseUrl(): string {
    const hostname = window.location.hostname;
    
    if (hostname === 'localhost') {
      return this.baseUrls.localhost;
    }
    
    if (hostname.includes('cv-app-02')) {
      return this.baseUrls.demo2;
    }
    
    if (hostname.includes('cv-app-04')) {
      return this.baseUrls.demo4;
    }
    
    // Por defecto asumimos producción
    return this.baseUrls.production;
  }

  generateReferralLink(userId: string): string {
    const baseUrl = this.getBaseUrl();
    return `${baseUrl}/home?ref=${userId}&view=register`;
  }

  getCurrentRefParam(): string | null {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('ref');
  }

  getEnvironmentType(): string {
    const hostname = window.location.hostname;
    
    if (hostname === 'localhost') return 'development';
    if (hostname.includes('cv-app-02')) return 'demo2';
    if (hostname.includes('cv-app-04')) return 'demo4';
    
    return 'production';
  }
}