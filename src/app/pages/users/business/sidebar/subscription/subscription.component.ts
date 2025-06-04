import { Component } from '@angular/core';
import { CommonModule } from '@angular/common'; // Importa CommonModule para habilitar pipes comunes
import { Router } from '@angular/router';
import { Database, set, ref } from '@angular/fire/database';

@Component({
  selector: 'app-subscription',
  standalone: true,
  templateUrl: './subscription.component.html',
  styleUrls: ['./subscription.component.css'],
  imports: [CommonModule
  ], // Importa CommonModule para los pipes como currency
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
      duracion: 365, // En días
    },
    {
      id: 'pequena_empresa',
      nombre: 'Plan Pequeña Empresa',
      descripcion: 'Ideal para pequeños negocios.',
      precio: 29.99,
      duracion: 30, // En días
    },
    {
      id: 'empresarial',
      nombre: 'Plan Empresarial',
      descripcion: 'Para grandes empresas.',
      precio: 299.99,
      duracion: 365, // En días
    },
  ];

  selectedPlan: any = null;

  constructor(private db: Database, private router: Router) {}

  // Método para seleccionar un plan
  selectPlan(plan: any): void {
    this.selectedPlan = plan;
  }

  // Método para suscribirse a un plan
  subscribe(): void {
    if (this.selectedPlan) {
      const userId = 'usuario123'; // Reemplázalo con el ID del usuario autenticado
      const fechaInicio = new Date().toISOString().split('T')[0];
      const fechaFin =
        this.selectedPlan.duracion === 'ilimitado'
          ? 'ilimitado'
          : this.calculateEndDate(fechaInicio, this.selectedPlan.duracion);

      // Guardar la suscripción en Firebase
      set(ref(this.db, `usuarios/${userId}/planes_adquiridos/${this.selectedPlan.id}`), {
        plan: this.selectedPlan.id,
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin,
        estado: 'activo',
      })
        .then(() => {
          alert('Suscripción realizada con éxito.');
          this.router.navigate(['/']); // Redirige después de la suscripción
        })
        .catch((error) => {
          console.error('Error al suscribirse:', error);
        });
    }
  }

  // Método para calcular la fecha de vencimiento del plan
  calculateEndDate(fechaInicio: string, duracion: number): string {
    const fecha = new Date(fechaInicio);
    fecha.setDate(fecha.getDate() + duracion);
    return fecha.toISOString().split('T')[0];
  }
}
