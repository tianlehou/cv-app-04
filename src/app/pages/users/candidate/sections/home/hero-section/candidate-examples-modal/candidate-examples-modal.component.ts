import { Component, EventEmitter, Output, Input, OnInit } from '@angular/core';
import { NgIf } from '@angular/common';
import { ExamplesService } from 'src/app/shared/services/examples.service';
import { GalleryComponent } from '../../../profile/gallery/gallery.component';
import { ProfilePictureComponent } from '../../../profile/profile-picture/profile-picture.component';
import { PersonalDataComponent } from '../../../profile/personal-data/personal-data.component';
import { ExamplePaginationComponent } from './example-pagination/example-pagination.component';
import { ExampleEditorActionsComponent } from './example-editor-actions/example-editor-actions.component';
import { ChangeDetectorRef } from '@angular/core';
import { ToastService } from 'src/app/shared/services/toast.service';

@Component({
  selector: 'app-candidate-examples-modal',
  standalone: true,
  imports: [
    NgIf,
    ProfilePictureComponent,
    PersonalDataComponent,
    GalleryComponent,
    ExamplePaginationComponent,
    ExampleEditorActionsComponent
  ],
  templateUrl: './candidate-examples-modal.component.html',
  styleUrls: ['./candidate-examples-modal.component.css']
})
export class CandidateExamplesModalComponent implements OnInit {
  @Input() isVisible = false;
  @Input() isEditor: boolean = false;
  @Output() closeModal = new EventEmitter<void>();
  currentExampleId: string = '';
  exampleIds: string[] = [];
  currentIndex: number = -1;

  constructor(
    private examplesService: ExamplesService,
    private cdr: ChangeDetectorRef,
    private toast: ToastService
  ) { }

  ngOnInit(): Promise<void> {
    return this.initExamples();
  }

  async initExamples() {
    this.exampleIds = await this.examplesService.getAllExampleIds();

    // Si no hay ejemplos, crear el primero
    if (this.exampleIds.length === 0) {
      console.log('CandidateExamplesModal - No examples found, creating first example...');
      try {
        const firstExampleId = await this.examplesService.generateExampleId();
        await this.examplesService.createExample(firstExampleId, {
          createdAt: new Date().toISOString(),
          images: []
        });
        // Recargar la lista de IDs
        this.exampleIds = await this.examplesService.getAllExampleIds();
      } catch (error) {
        console.error('Error al crear el primer ejemplo:', error);
        this.toast.show('Error al crear el primer ejemplo', 'error');
      }
    }

    if (this.exampleIds.length > 0) {
      this.currentIndex = 0;
      this.currentExampleId = this.exampleIds[this.currentIndex];
      this.cdr.detectChanges();
    } else {
      console.warn('CandidateExamplesModal - No example IDs available');
    }
    this.examplesService.setCurrentExampleId(this.currentExampleId);
    this.cdr.detectChanges();
  }

  async onPageChange(newPage: number) {
    if (newPage >= 1 && newPage <= this.exampleIds.length) {
      this.currentIndex = newPage - 1;
      this.currentExampleId = this.exampleIds[this.currentIndex];
      this.examplesService.setCurrentExampleId(this.currentExampleId);
    }
  }

  async navigateExample(direction: 'next' | 'prev') {
    const newIndex = direction === 'next' ? this.currentIndex + 1 : this.currentIndex - 1;
    this.onPageChange(newIndex + 1);
  }

  onClose() {
    this.closeModal.emit();
  }

  async addExample() {
    try {
      this.currentExampleId = await this.examplesService.generateExampleId();
      this.examplesService.setCurrentExampleId(this.currentExampleId);

      await this.examplesService.createExample(this.currentExampleId, {
        createdAt: new Date().toISOString(),
        images: []
      });

      this.exampleIds = await this.examplesService.getAllExampleIds();
      this.currentIndex = this.exampleIds.indexOf(this.currentExampleId);
      this.cdr.detectChanges();
    } catch (error) {
      console.error('Error al crear ejemplo:', error);
      this.toast.show('Error al crear ejemplo', 'error');
    }
  }

  async deleteExample() {
    try {
      const result = await this.examplesService.deleteExample(this.currentExampleId);
      
      if (result.remainingIds.length > 0) {
        this.exampleIds = result.remainingIds;
        this.currentExampleId = result.newCurrentId || this.exampleIds[0];
        this.currentIndex = this.exampleIds.indexOf(this.currentExampleId);
      } else {
        await this.addExample(); // Crear nuevo si no quedan ejemplos
      }
      
      this.cdr.detectChanges();
    } catch (error) {
      console.error('Error al eliminar ejemplo:', error);
      this.toast.show('Error al eliminar ejemplo', 'error');
    }
  }
}
