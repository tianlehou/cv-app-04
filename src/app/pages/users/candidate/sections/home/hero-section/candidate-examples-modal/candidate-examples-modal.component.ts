import { Component, EventEmitter, Output, Input, OnInit } from '@angular/core';
import { NgIf } from '@angular/common';
import { ExamplesService } from 'src/app/shared/services/examples.service';
import { GalleryComponent } from '../../../profile/galerry/gallery.component';
import { ProfilePictureComponent } from '../../../profile/profile-picture/profile-picture.component';
import { PersonalDataComponent } from '../../../profile/personal-data/personal-data.component';
import { ExamplePaginationComponent } from './example-pagination/example-pagination.component';
import { ExampleEditorActionsComponent } from './example-editor-actions/example-editor-actions.component';

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

  constructor(private examplesService: ExamplesService) { }

  ngOnInit(): Promise<void> {
    return this.initExamples();
  }

  async initExamples() {
    this.exampleIds = await this.examplesService.getAllExampleIds();
    if (this.exampleIds.length > 0) {
      this.currentIndex = 0;
      this.currentExampleId = this.exampleIds[this.currentIndex];
    }
  }

  async onPageChange(newPage: number) {
    if (newPage >= 1 && newPage <= this.exampleIds.length) {
      this.currentIndex = newPage - 1;
      this.currentExampleId = this.exampleIds[this.currentIndex];
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
    this.currentExampleId = await this.examplesService.generateExampleId();

    await this.examplesService.createExample(this.currentExampleId, {
      createdAt: new Date().toISOString(),
      images: []
    });
  }

  deleteExample() {
    if (this.currentExampleId && confirm('¿Estás seguro de eliminar este ejemplo?')) {
      this.examplesService.deleteExample(this.currentExampleId);
    }
  }
}
