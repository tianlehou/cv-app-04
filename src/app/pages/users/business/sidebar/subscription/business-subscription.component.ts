import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Database, set, ref, update } from '@angular/fire/database';
import { ReferralService } from '../../../candidate/sections/refer/referral.service';
import { AuthService } from 'src/app/pages/home/auth/auth.service';
import { FirebaseService } from 'src/app/shared/services/firebase.service';
import { ToastService } from 'src/app/shared/services/toast.service';
import { BusinessComparisonTableComponent } from './comparison-table/business-comparison-table.component';

@Component({
  selector: 'app-business-subscription',
  standalone: true,
  imports: [CommonModule, BusinessComparisonTableComponent ],
  templateUrl: './business-subscription.component.html',
  styleUrls: ['./business-subscription.component.css'],
})
export class BusinessSubscriptionComponent implements OnInit {
  // subscription.component.ts (actualización del array plans)
  plans = [
    {
      id: 'gratuito',
      nombre: 'Plan Gratuito',
      descripcion: 'Acceso básico sin costo.',
      precio: 0,
      duracion: 'ilimitado',
      beneficios: [
        'Acceso básico a plantillas',
        '1 CV generado por mes',
        'Soporte por correo electrónico',
        'Descargas en formato PDF'
      ]
    },
    {
      id: 'mensualidad',
      nombre: 'Plan Estrella',
      precio: 29.99,
      duracion: 30,
      beneficios: [
        'Todas las plantillas premium',
        '5 CVs generados por mes',
        'Soporte prioritario',
        'Descargas en PDF y Word',
        'Acceso a estadísticas básicas'
      ]
    },
    {
      id: 'anualidad',
      nombre: 'Plan Premium',
      precio: 299.99,
      duracion: 365,
      beneficios: [
        'Todas las plantillas premium + exclusivas',
        'CVs ilimitados',
        'Soporte 24/7',
        'Descargas en múltiples formatos',
        'Estadísticas avanzadas',
        'Asesoría profesional incluida',
        'Exportación a LinkedIn'
      ]
    }
  ];

  currentUser: any;
  selectedPlan: any = null;
  hasActiveSubscription = false;
  activePlanId: string | null = null;
  activePlanExpiration: string | null = null;
  daysRemaining: number | null = null;
  showConfirmationModal = false;
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
      const today = new Date().toISOString().split('T')[0];

      if (userData?.planes_adquiridos) {
        let needsUpdate = false;

        // Verificar y actualizar planes vencidos
        for (const [planId, planData] of Object.entries(userData.planes_adquiridos)) {
          const plan = planData as any;
          // Cambiamos la condición para incluir el día de expiración
          if (plan.estado === 'activo' && plan.fecha_fin !== 'ilimitado' &&
            (plan.fecha_fin <= today || this.isPlanExpired(plan.fecha_fin))) {
            await update(ref(this.db, `cv-app/users/${emailKey}/planes_adquiridos/${planId}`), {
              estado: 'vencido'
            });
            needsUpdate = true;
            console.log(`Plan ${planId} marcado como vencido`);
          }
        }

        // Si actualizamos algún plan, recargar los datos
        if (needsUpdate) {
          await new Promise(resolve => setTimeout(resolve, 1000)); // Delay más largo para Firebase
          return this.ngOnInit(); // Recargar
        }

        // Buscar plan activo (actualizado)
        const updatedData = await this.firebaseService.getUserData(emailKey);
        const activePlan = updatedData?.planes_adquiridos ?
          Object.values(updatedData.planes_adquiridos).find(
            (plan: any) => plan.estado === 'activo'
          ) : null;

        if (activePlan) {
          this.hasActiveSubscription = true;
          this.activePlanId = (activePlan as { plan: string }).plan;
          this.activePlanExpiration = (activePlan as { fecha_fin: string }).fecha_fin;

          // Calcular días restantes si no es ilimitado
          if (this.activePlanExpiration !== 'ilimitado') {
            const endDate = new Date(this.activePlanExpiration);
            const today = new Date();
            const diffTime = endDate.getTime() - today.getTime();
            this.daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          } else {
            this.daysRemaining = null;
          }
        } else {
          this.resetSubscriptionData();
        }
      } else {
        this.resetSubscriptionData();
      }
    }
  }

  private resetSubscriptionData(): void {
    this.hasActiveSubscription = false;
    this.activePlanId = null;
    this.activePlanExpiration = null;
    this.daysRemaining = null;
  }

  selectPlan(plan: any): void {
    // No permitir seleccionar el plan gratuito o el plan actualmente activo
    if (plan.id !== 'gratuito' && plan.id !== this.activePlanId) {
      this.selectedPlan = plan;
      this.showConfirmationModal = true;
    } else {
      this.selectedPlan = null;
      this.showConfirmationModal = false;
    }
  }

  cancelSubscription(): void {
    this.showConfirmationModal = false;
    this.selectedPlan = null;
  }

  async subscribe(): Promise<void> {
    if (!this.selectedPlan || !this.currentUser?.email) return;

    try {
      // Resetear días restantes mientras se procesa
      this.daysRemaining = null;

      const emailKey = this.firebaseService.formatEmailKey(this.currentUser.email);
      const fechaInicio = new Date().toISOString().split('T')[0];
      const fechaFin = this.selectedPlan.duracion === 'ilimitado'
        ? 'ilimitado'
        : this.calculateEndDate(fechaInicio, this.selectedPlan.duracion);

      // 1. Guardar suscripción en Firebase
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
        await this.referralService.updateReferralSubscription(
          this.currentUser.email,
          this.selectedPlan.precio,
          this.selectedPlan.id
        );
      }

      // Verificar el estado actualizado en Firebase
      const updatedData = await this.firebaseService.getUserData(emailKey);
      if (updatedData?.planes_adquiridos?.[this.selectedPlan.id]) {
        const planData = updatedData.planes_adquiridos[this.selectedPlan.id];
        this.activePlanExpiration = planData.fecha_fin;

        // Calcular días restantes con los datos actualizados
        if (planData.fecha_fin !== 'ilimitado') {
          this.daysRemaining = Math.ceil(
            (new Date(planData.fecha_fin).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
          );
        }
      }

      // Actualizar estado local
      this.hasActiveSubscription = true;
      this.activePlanId = this.selectedPlan.id;

      // Calcular días restantes localmente como respaldo
      if (fechaFin !== 'ilimitado') {
        this.daysRemaining = Math.ceil(
          (new Date(fechaFin).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
        );
      }

      this.toastService.show('Suscripción realizada con éxito', 'success');
      this.showConfirmationModal = false;
    } catch (error) {
      console.error('Error en suscripción:', error);
      this.toastService.show('Error al procesar la suscripción', 'error');
      this.daysRemaining = null; // Resetear en caso de error
    }
  }

  private calculateEndDate(fechaInicio: string, duracion: number): string {
    const fecha = new Date(fechaInicio);
    fecha.setDate(fecha.getDate() + duracion);
    return fecha.toISOString().split('T')[0];
  }

  private isPlanExpired(expirationDate: string): boolean {
    const today = new Date();
    const expDate = new Date(expirationDate);
    // Considerar expirado si es el mismo día pero ya pasó la hora
    return expDate <= today;
  }
}