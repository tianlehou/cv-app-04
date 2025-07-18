import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { createEnvironmentInjector, EnvironmentInjector } from '@angular/core';
import { registerLocaleData } from '@angular/common';
import localeEs from '@angular/common/locales/es';

import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideFirestore, getFirestore } from '@angular/fire/firestore';
import { provideDatabase, getDatabase } from '@angular/fire/database';
import { provideStorage, getStorage } from '@angular/fire/storage';
import { provideAuth, getAuth } from '@angular/fire/auth';

// Registrar el locale español
registerLocaleData(localeEs, 'es');

import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';
import { routes } from './app/app.routes';
import { FirebaseConfigService } from './app/shared/services/firebase-config.service';

// Helper function to create a temporary injector
function createRootInjector(): EnvironmentInjector {
  return createEnvironmentInjector([], undefined as unknown as EnvironmentInjector);
}

function injectorForFirebaseConfig(): EnvironmentInjector {
  const rootInjector = createRootInjector();
  return createEnvironmentInjector(
    [
      { provide: FirebaseConfigService, useClass: FirebaseConfigService }
    ],
    rootInjector
  );
}

// Create a temporary injector to get the Firebase config
const tempInjector = injectorForFirebaseConfig();
const firebaseConfig = tempInjector.get(FirebaseConfigService).getConfig();

bootstrapApplication(AppComponent, {
  ...appConfig,
  providers: [
    provideRouter(routes, withComponentInputBinding()),
    provideFirebaseApp(() => initializeApp(firebaseConfig)),
    provideAuth(() => getAuth()),
    provideFirestore(() => getFirestore()),
    provideStorage(() => getStorage()),
    provideDatabase(() => getDatabase()),
  ],
}).catch((err) => console.error('Error during app bootstrap:', err));