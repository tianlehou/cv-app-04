import { Component, OnInit } from '@angular/core';
import { FirebaseService } from '../../../../../shared/services/firebase.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-metadata-migration',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="container mt-5">
      <div class="card">
        <div class="card-header">
          <h2>Migración de metadatos</h2>
        </div>
        <div class="card-body">
          <p>Estado: {{ status }}</p>
          <button 
            class="btn btn-primary" 
            (click)="runMigration()" 
            [disabled]="migrationRunning">
            {{ migrationRunning ? 'Ejecutando...' : 'Ejecutar migración' }}
          </button>
          
          <div class="mt-3" *ngIf="results.length > 0">
            <h3>Resultados:</h3>
            <ul class="list-group">
              <li class="list-group-item" *ngFor="let result of results">{{ result }}</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class MetadataMigrationComponent implements OnInit {
  status = 'Listo para ejecutar migración';
  migrationRunning = false;
  results: string[] = [];

  constructor(private firebaseService: FirebaseService) {}

  ngOnInit() {}

  async runMigration() {
    if (this.migrationRunning) return;
    
    this.migrationRunning = true;
    this.status = 'Ejecutando migración...';
    this.results = [];
    
    try {
      await this.firebaseService.migrateAllUsersMetadata();
      this.status = 'Migración completada exitosamente';
      this.results.push('Todos los datos de metadatos han sido migrados correctamente');
    } catch (error) {
      console.error('Error en la migración:', error);
      this.status = 'Error durante la migración';
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      this.results.push(`Error: ${errorMessage}`);
    } finally {
      this.migrationRunning = false;
    }
  }
}