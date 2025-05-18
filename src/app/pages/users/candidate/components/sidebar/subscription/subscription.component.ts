import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Database, set, ref, update } from '@angular/fire/database';
import { ReferralService } from '../refer/referral.service';
import { AuthService } from 'src/app/pages/home/user-type-modal/auth/auth.service';
import { FirebaseService } from 'src/app/shared/services/firebase.service';
import { ToastService } from 'src/app/shared/services/toast.service';

@Component({
  selector: 'app-subscription',
  standalone: true,
  templateUrl: './subscription.component.html',
  styleUrls: ['./subscription.component.css'],
  imports: [CommonModule],
})
export class SubscriptionComponent implements OnInit {
  plans = [
    {
      id: 'gratuito',
      nombre: 'Plan Gratuito',
      descripcion: 'Acceso básico sin costo.',
      precio: 0,
      duracion: 'ilimitado',
    },
    {
      id: 'mensualidad',
      nombre: 'Candidato Estrella',
      descripcion: 'Acceso por 30 días.',
      precio: 1.99,
      duracion: 30,
    },
    {
      id: 'anualidad',
      nombre: 'Candidato Premium',
      descripcion: 'Ideal para todo candidato.',
      precio: 9.99,
      duracion: 365,
    },
  ];

  hasActiveSubscription = false;
  activePlanId: string | null = null;
  selectedPlan: any = null;
  currentUser: any;
  private toastService = inject(ToastService);

  constructor(
    private db: Database,
    private firebaseService: FirebaseService,
    private referralService: ReferralService,
    private authService: AuthService,
  ) {
    this.currentUser = this.authService.getCurrentAuthUser();
  }

  async ngOnInit(): Promise<void> {
    if (this.currentUser?.email) {
      const emailKey = this.firebaseService.formatEmailKey(this.currentUser.email);
      const userData = await this.firebaseService.getUserData(emailKey);

      if (userData?.planes_adquiridos) {
        const activePlan = Object.values(userData.planes_adquiridos).find(
          (plan: any) => plan.estado === 'activo'
        );

        if (activePlan) {
          this.hasActiveSubscription = true;
          this.activePlanId = (activePlan as { plan: string }).plan;
        }
      }
    }
  }

  selectPlan(plan: any): void {
    this.selectedPlan = plan;
  }

  async subscribe(): Promise<void> {
    if (!this.selectedPlan || !this.currentUser?.email) {
      this.toastService?.show('Datos incompletos para suscripción', 'error');
      return;
    }

    const emailKey = this.firebaseService.formatEmailKey(this.currentUser.email);
    
    try {
      // 1. Guardar suscripción en el usuario
      const fechaInicio = new Date().toISOString().split('T')[0];
      const fechaFin = this.selectedPlan.duracion === 'ilimitado'
        ? 'ilimitado'
        : this.calculateEndDate(fechaInicio, this.selectedPlan.duracion);

      await set(ref(this.db, `cv-app/users/${emailKey}/planes_adquiridos/${this.selectedPlan.id}`), {
        plan: this.selectedPlan.id,
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin,
        estado: 'activo',
      });

      // 2. Actualizar metadata
      await update(ref(this.db, `cv-app/users/${emailKey}/metadata`), {
        subscriptionStatus: this.selectedPlan.precio
      });

      // 3. Actualizar referencia si existe
      const userData = await this.firebaseService.getUserData(emailKey);
      if (userData?.metadata?.referredBy) {
        console.log('Actualizando referencia para:', userData.metadata.referredBy);
        await this.referralService.updateReferralSubscription(
          this.currentUser.email,
          this.selectedPlan.precio,
          this.selectedPlan.id
        );
      }

      this.toastService?.show('Suscripción realizada con éxito', 'success');
      this.hasActiveSubscription = true;
      this.activePlanId = this.selectedPlan.id;
    } catch (error) {
      console.error('Error en suscripción:', error);
      this.toastService?.show('Error al procesar la suscripción', 'error');
    }
  }

  private calculateEndDate(fechaInicio: string, duracion: number): string {
    const fecha = new Date(fechaInicio);
    fecha.setDate(fecha.getDate() + duracion);
    return fecha.toISOString().split('T')[0];
  }
}