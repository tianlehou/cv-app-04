import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Database, set, ref, update } from '@angular/fire/database';
import { ReferralService } from '../refer/referral.service';
import { AuthService } from 'src/app/pages/home/user-type-modal/auth/auth.service';
import { FirebaseService } from 'src/app/shared/services/firebase.service';

@Component({
  selector: 'app-subscription',
  standalone: true,
  templateUrl: './subscription.component.html',
  styleUrls: ['./subscription.component.css'],
  imports: [CommonModule
  ],
})
export class SubscriptionComponent {
  plans = [
    {
      id: 'gratuito',
      nombre: 'Plan Gratuito',
      descripcion: 'Acceso básico sin costo.',
      precio: 0,
      duracion: 'ilimitado',
    },
    {
      id: 'anualidad',
      nombre: 'Candidato Estrella',
      descripcion: 'Ideal para todo candidato.',
      precio: 9.99,
      duracion: 365,
    }
  ];

  selectedPlan: any = null;
  currentUser: any;

  constructor(
    private db: Database,
    private firebaseService: FirebaseService,
    private referralService: ReferralService,
    private authService: AuthService
  ) {
    this.currentUser = this.authService.getCurrentAuthUser();
  }

  // Método para seleccionar un plan
  selectPlan(plan: any): void {
    this.selectedPlan = plan;
  }

  // Método para suscribirse a un plan
  async subscribe(): Promise<void> {
    if (!this.selectedPlan || !this.currentUser?.email) {
      console.error('Datos incompletos para suscripción');
      return;
    }

    const emailKey = this.firebaseService.formatEmailKey(this.currentUser.email);
    console.log('Intentando escribir en:', `cv-app/users/${emailKey}/planes_adquiridos`);

    const fechaInicio = new Date().toISOString().split('T')[0];
    const fechaFin = this.selectedPlan.duracion === 'ilimitado'
      ? 'ilimitado'
      : this.calculateEndDate(fechaInicio, this.selectedPlan.duracion);

    try {
      // 1. Guardar suscripción en el perfil del usuario (para todos los casos)
      await set(ref(this.db, `cv-app/users/${emailKey}/planes_adquiridos/${this.selectedPlan.id}`), {
        plan: this.selectedPlan.id,
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin,
        estado: 'activo',
      });

      // 2. Actualizar estado de suscripción en metadata
      await update(ref(this.db, `cv-app/users/${emailKey}/metadata`), {
        subscriptionStatus: this.selectedPlan.precio
      });

      // 3. Obtener datos completos del usuario para verificar si fue referido
      const userData = await this.firebaseService.getUserData(emailKey);

      // 4. Solo actualizar referrals si el usuario fue referido
      if (userData?.metadata?.referredBy) {
        await this.referralService.updateReferralSubscription(
          this.currentUser.email,
          this.selectedPlan.precio
        );
      }

      alert('Suscripción realizada con éxito.');
    } catch (error) {
      console.error('Error al suscribirse:', error);
    }
  }

  calculateEndDate(fechaInicio: string, duracion: number): string {
    const fecha = new Date(fechaInicio);
    fecha.setDate(fecha.getDate() + duracion);
    return fecha.toISOString().split('T')[0];
  }
}
