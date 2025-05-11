// firebase-config.service.ts
import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

type FirebaseConfig = {
  apiKey: string;
  authDomain: string;
  databaseURL: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId?: string;
};

type EnvironmentConfigs = {
  production: FirebaseConfig;
  demo2: FirebaseConfig;
  demo4: FirebaseConfig;
  development: FirebaseConfig;
};

@Injectable({
  providedIn: 'root'
})
export class FirebaseConfigService {
  private readonly configs = {
    production: {
      apiKey: "AIzaSyD5lxTm7woOnHXqBJn0WgFh3O00vA9TvNM",
      authDomain: "cvapp-3b9e1.firebaseapp.com",
      databaseURL: "https://cvapp-3b9e1-default-rtdb.firebaseio.com",
      projectId: "cvapp-3b9e1",
      storageBucket: "cvapp-3b9e1.appspot.com",
      messagingSenderId: "773394034188",
      appId: "1:773394034188:web:57e60ed4a8203f61e8c829",
      measurementId: "G-371ZE54HGP"
    },
    demo2: {
      apiKey: "AIzaSyAE2zRCmw6HRTDPzz7uFLnAXD-KIy23e8Q",
      authDomain: "auth-37197.firebaseapp.com",
      databaseURL: "https://auth-37197-default-rtdb.firebaseio.com",
      projectId: "auth-37197",
      storageBucket: "auth-37197.appspot.com",
      messagingSenderId: "244668122553",
      appId: "1:244668122553:web:5580d1410dd8a66c3b6268"
    },
    demo4: {
      apiKey: "AIzaSyB4mqiJm2UaKE8n2Fe4nwwtqwPhoSps2Pk",
      authDomain: "joako-cobros-app.firebaseapp.com",
      databaseURL: "https://joako-cobros-app-default-rtdb.firebaseio.com",
      projectId: "joako-cobros-app",
      storageBucket: "joako-cobros-app.appspot.com",
      messagingSenderId: "295649239563",
      appId: "1:295649239563:web:fa445bb9aa42fa1161dd0e"
    },
    development: {
      apiKey: "AIzaSyB4mqiJm2UaKE8n2Fe4nwwtqwPhoSps2Pk",
      authDomain: "joako-cobros-app.firebaseapp.com",
      databaseURL: "https://joako-cobros-app-default-rtdb.firebaseio.com",
      projectId: "joako-cobros-app",
      storageBucket: "joako-cobros-app.appspot.com",
      messagingSenderId: "295649239563",
      appId: "1:295649239563:web:fa445bb9aa42fa1161dd0e"
    }
  };

  getConfig(): FirebaseConfig {
    // Fallback to our service configurations based on environment type
    const envType = environment.environmentType || 'development';
    return this.configs[envType as keyof EnvironmentConfigs] || this.configs.development;
  }

  getEnvironmentType(): string {
    return environment.environmentType || 'development';
  }
}