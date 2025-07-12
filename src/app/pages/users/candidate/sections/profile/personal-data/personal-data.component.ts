import { Component, OnInit, Input, OnDestroy, inject, SimpleChanges, NgZone, ChangeDetectorRef } from '@angular/core';
import { EnvironmentInjector, runInInjectionContext } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { User } from '@angular/fire/auth';
import { Database, ref, get, onValue } from '@angular/fire/database';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { ProfileService } from '../../../services/profile.service';
import { ToastService } from 'src/app/shared/services/toast.service';
import { FirebaseService } from 'src/app/shared/services/firebase.service';

@Component({
  selector: 'app-personal-data',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './personal-data.component.html',
  styleUrls: ['./personal-data.component.css'],
})
export class PersonalDataComponent implements OnInit, OnDestroy {
  @Input() currentUser: User | null = null;
  @Input() isExample: boolean = false;
  @Input() exampleId: string | null = null;

  profileForm!: FormGroup;
  editableFields: { [key: string]: boolean } = {};
  private subscription!: Subscription;
  private unsubscribeExample?: () => void;
  private currentExampleSubscription?: Subscription;
  private injector = inject(EnvironmentInjector);
  private db = inject(Database);

  countries = [
    { code: 'Panama', name: 'Panamá' },
    { code: 'Argentina', name: 'Argentina' },
    { code: 'Bolivia', name: 'Bolivia' },
    { code: 'Brazil', name: 'Brasil' },
    { code: 'Chile', name: 'Chile' },
    { code: 'Colombia', name: 'Colombia' },
    { code: 'Costa Rica', name: 'Costa Rica' },
    { code: 'Cuba', name: 'Cuba' },
    { code: 'Ecuador', name: 'Ecuador' },
    { code: 'El Salvador', name: 'El Salvador' },
    { code: 'España', name: 'España' },
    { code: 'USA', name: 'Estados Unidos' },
    { code: 'Guatemala', name: 'Guatemala' },
    { code: 'Honduras', name: 'Honduras' },
    { code: 'Nicaragua', name: 'Nicaragua' },
    { code: 'Mexico', name: 'México' },
    { code: 'Paraguay', name: 'Paraguay' },
    { code: 'Peru', name: 'Perú' },
    { code: 'Puerto Rico', name: 'Puerto Rico' },
    { code: 'Rep. Dominicana', name: 'República Dominicana' },
    { code: 'Uruguay', name: 'Uruguay' },
    { code: 'Venezuela', name: 'Venezuela' },
  ];

  constructor(
    private fb: FormBuilder,
    private profileService: ProfileService,
    private firebaseService: FirebaseService,
    private toastService: ToastService,
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.initializeForm();
    this.loadData();

    // Suscripción a actualizaciones de datos personales
    this.subscription = this.profileService.personalDataUpdated$
      .pipe(
        filter(() => !this.isExample) // Solo para usuarios reales
      )
      .subscribe((updatedData) => {
        this.ngZone.run(() => {
          this.profileForm.patchValue(updatedData || {});
          this.cdr.detectChanges();
        });
      });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['exampleId'] || changes['isExample']) {
      this.loadData();
    }
  }

  private loadData(): void {
    if (this.isExample) {
      if (this.exampleId) {
        this.loadExampleData();
      }
    } else if (this.currentUser) {
      this.loadUserData();
    } else {
      console.warn('PersonalDataComponent - loadData - No hay usuario ni modo ejemplo activo');
    }
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
    if (this.unsubscribeExample) this.unsubscribeExample();
    if (this.currentExampleSubscription) this.currentExampleSubscription.unsubscribe();
  }

  private initializeForm(): void {
    this.profileForm = this.fb.group({
      fullName: [''],
      profesion: [''],
      phone: [''],
      editableEmail: [''],
      direction: [''],
      country: [''],
    });
  }

  private loadUserData(): void {
    if (!this.currentUser?.email) return;

    runInInjectionContext(this.injector, () => {
      const userEmailKey = this.firebaseService.formatEmailKey(this.currentUser!.email!);
      const userPath = `cv-app/users/${userEmailKey}`;
      const userRef = ref(this.db, userPath);

      // Cargar datos iniciales
      get(userRef).then(snapshot => {
        this.processUserSnapshot(snapshot);
      }).catch(error => {
        console.error('Error cargando datos de usuario:', error);
        this.toastService.show('Error al cargar los datos', 'error', 3000);
      });

      // Configurar escucha de cambios en tiempo real
      this.unsubscribeExample = onValue(userRef,
        (snapshot) => {
          this.processUserSnapshot(snapshot);
        },
        (error) => {
          console.error('Error en tiempo real (usuario):', error);
        }
      );
    });
  }

  private loadExampleData(): void {
    if (!this.exampleId) return;

    runInInjectionContext(this.injector, () => {
      const examplePath = `cv-app/examples/${this.exampleId}`;
      const exampleRef = ref(this.db, examplePath);

      // Cargar datos iniciales
      get(exampleRef).then(snapshot => {
        this.processExampleSnapshot(snapshot);
      }).catch(error => {
        console.error('Error cargando datos de ejemplo:', error);
        this.toastService.show('Error al cargar el ejemplo', 'error', 3000);
      });

      // Configurar escucha de cambios en tiempo real
      this.unsubscribeExample = onValue(exampleRef,
        (snapshot) => {
          this.processExampleSnapshot(snapshot);
        },
        (error) => {
          console.error('Error en tiempo real (ejemplo):', error);
        }
      );
    });
  }

  private processUserSnapshot(snapshot: any): void {
    this.ngZone.run(() => {
      if (snapshot.exists()) {
        const userData = snapshot.val();
        const personalData = {
          fullName: userData?.profileData?.personalData?.fullName || '',
          profesion: userData?.profileData?.personalData?.profesion || '',
          phone: userData?.profileData?.personalData?.phone || '',
          editableEmail: userData?.profileData?.personalData?.editableEmail || '',
          direction: userData?.profileData?.personalData?.direction || '',
          country: userData?.metadata?.country || ''
        };
        this.profileForm.patchValue(personalData);
      } else {
        console.warn('No se encontraron datos de usuario');
        this.profileForm.reset();
      }
      this.cdr.detectChanges();
    });
  }

  private processExampleSnapshot(snapshot: any): void {
    this.ngZone.run(() => {
      if (snapshot.exists()) {
        const exampleData = snapshot.val();
        const personalData = {
          fullName: exampleData?.profileData?.personalData?.fullName || '',
          profesion: exampleData?.profileData?.personalData?.profesion || '',
          phone: exampleData?.profileData?.personalData?.phone || '',
          editableEmail: exampleData?.profileData?.personalData?.editableEmail || '',
          direction: exampleData?.profileData?.personalData?.direction || '',
          country: exampleData?.metadata?.country || ''
        };
        this.profileForm.patchValue(personalData);
      } else {
        console.warn('No se encontraron datos de ejemplo');
        this.profileForm.reset();
      }
      this.cdr.detectChanges();
    });
  }

  getCountryName(countryCode: string): string {
    const country = this.countries.find(c => c.code === countryCode);
    return country ? country.name : countryCode;
  }
}