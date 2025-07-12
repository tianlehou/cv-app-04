import { Component, Input, OnInit, OnDestroy, OnChanges, SimpleChanges, ChangeDetectorRef, EnvironmentInjector, NgZone } from '@angular/core';
import { Subscription } from 'rxjs';
import { filter, distinctUntilChanged } from 'rxjs/operators';
import { ProfileService } from '../../../services/profile.service';
import { EditPictureAndDataButtonComponent } from './edit-picture-and-data-button/edit-picture-and-data-button.component';
import { EditProfilePictureComponent } from './edit-profile-picture/edit-profile-picture.component';
import { EditPersonalDataComponent } from './edit-personal-data/edit-personal-data.component';
import { CommonModule } from '@angular/common';
import { Database, ref, get, onValue } from '@angular/fire/database';
import { inject, runInInjectionContext } from '@angular/core';
import { FirebaseService } from 'src/app/shared/services/firebase.service';
import { ExamplesService } from 'src/app/shared/services/examples.service';

@Component({
  selector: 'app-profile-picture',
  standalone: true,
  imports: [CommonModule, EditPictureAndDataButtonComponent, EditProfilePictureComponent, EditPersonalDataComponent],
  templateUrl: './profile-picture.component.html',
  styleUrls: ['./profile-picture.component.css'],
})
export class ProfilePictureComponent implements OnInit, OnDestroy, OnChanges {
  @Input() currentUser: any; // Aceptamos cualquier estructura de usuario
  @Input() isEditor: boolean = false;
  @Input() isExample: boolean = false;
  @Input() readOnly: boolean = false;
  @Input() exampleId: string | null = null; // ID del ejemplo actual
  
  profilePictureUrl: string | null = null;
  private subscription!: Subscription;
  private unsubscribeExample?: () => void;
  private currentExampleSubscription?: Subscription;

  // Estado de visibilidad de los modales
  showProfilePictureModal = false;
  showPersonalDataModal = false;

  private db = inject(Database);
  private cdr = inject(ChangeDetectorRef);
  private injector = inject(EnvironmentInjector);
  private ngZone = inject(NgZone);
  private firebaseService = inject(FirebaseService);
  private examplesService = inject(ExamplesService);
  private userEmailKey: string | null = null;

  constructor(
    private profileService: ProfileService
  ) {}

  ngOnInit(): void {
    if (this.isExample) {
      this.currentExampleSubscription = this.examplesService.currentExampleId$
        .pipe(
          filter(exampleId => !!exampleId),
          distinctUntilChanged()
        )
        .subscribe(exampleId => {
          this.loadExampleProfile(exampleId);
        });
    } else if (this.currentUser?.email) {
      this.userEmailKey = this.firebaseService.formatEmailKey(this.currentUser.email);
      this.loadUserProfile();
    } else {
      console.warn('No se pudo inicializar: No hay usuario actual y no está en modo ejemplo');
    }

    // Suscripción al servicio de perfil para actualizaciones
    this.subscription = this.profileService.profilePictureUpdated$
      .pipe(
        filter(() => !this.isExample) // Solo procesar si no estamos en modo ejemplo
      )
      .subscribe(() => {
        this.loadUserProfile();
      });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.isExample && this.exampleId) {
      if (changes['exampleId'] || changes['isExample']) {
        this.loadExampleProfile(this.exampleId);
      }
    } else if (this.userEmailKey) {
      if (changes['currentUser'] || changes['isExample']) {
        this.loadUserProfile();
      }
    }
  }

  ngOnDestroy(): void {
    if (this.unsubscribeExample) this.unsubscribeExample();
    if (this.currentExampleSubscription) this.currentExampleSubscription.unsubscribe();
    if (this.subscription) this.subscription.unsubscribe();
  }

  private loadExampleProfile(exampleId: string): void {    
    runInInjectionContext(this.injector, () => {
      const examplePath = `cv-app/examples/${exampleId}`;
      const exampleRef = ref(this.db, examplePath);
      
      // Cargar datos iniciales
      get(exampleRef).then(snapshot => {
        this.processProfileSnapshot(snapshot);
      }).catch(error => {
        console.error('Error cargando perfil de ejemplo:', {
          error,
          exampleId,
          path: examplePath,
          timestamp: new Date().toISOString()
        });
      });
      
      // Configurar escucha de cambios en tiempo real
      this.unsubscribeExample = onValue(exampleRef, 
        (snapshot) => {
          this.processProfileSnapshot(snapshot);
        },
        (error) => {
          console.error('Error en tiempo real (ejemplo):', {
            error,
            exampleId,
            timestamp: new Date().toISOString()
          });
        }
      );
    });
  }

  private processProfileSnapshot(snapshot: any): void {
    this.ngZone.run(() => {
      if (snapshot.exists()) {
        const profileData = snapshot.val();
        
        // Manejar tanto la estructura plana como anidada
        if (profileData.profilePicture) {
          this.profilePictureUrl = profileData.profilePicture;
        } else if (profileData.multimedia?.picture?.profilePicture) {
          this.profilePictureUrl = profileData.multimedia.picture.profilePicture;
        } else {
          this.profilePictureUrl = null;
        }
      } else {
        console.warn('No se encontraron datos de perfil');
        this.profilePictureUrl = null;
      }
      this.cdr.detectChanges();
    });
  }

  private async loadUserProfile(): Promise<void> {
    if (!this.userEmailKey) return;
    
    try {
      const userData = await this.firebaseService.getUserData(this.userEmailKey);
      if (userData) {
        this.ngZone.run(() => {
          // Intentar con la estructura dashboard primero
          if (userData.profileData?.multimedia?.picture?.profilePicture) {
            this.profilePictureUrl = userData.profileData.multimedia.picture.profilePicture;
          } 
          // Luego con la estructura de perfil normal
          else if (userData.multimedia?.picture?.profilePicture) {
            this.profilePictureUrl = userData.multimedia.picture.profilePicture;
          } else {
            this.profilePictureUrl = null;
          }
          this.cdr.detectChanges();
        });
      }
    } catch (error) {
      console.error('Error cargando perfil de usuario:', error);
    }
  }

  // Método para manejar la edición de la foto de perfil
  onEditProfilePicture(): void {
    this.showProfilePictureModal = true;
    // Desplazar al inicio de la página para asegurar que el modal sea visible
    window.scrollTo(0, 0);
  }

  // Método para manejar la edición de datos personales
  onEditPersonalData(): void {
    this.showPersonalDataModal = true;
    // Desplazar al inicio de la página para asegurar que el modal sea visible
    window.scrollTo(0, 0);
  }

  // Método para manejar el cierre del modal de foto de perfil
  onProfilePictureUpdated(updated: boolean): void {
    if (updated) {
      if (this.isExample && this.exampleId) {
        this.loadExampleProfile(this.exampleId);
      } else if (this.userEmailKey) {
        this.loadUserProfile();
      }
    }
    this.showProfilePictureModal = false;
  }

  // Método para manejar el cierre del modal de datos personales
  onPersonalDataUpdated(updated: boolean): void {
    this.showPersonalDataModal = false;
  }
}