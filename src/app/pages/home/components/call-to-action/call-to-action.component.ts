import { Component, Output, EventEmitter, ViewChild } from '@angular/core';
import { UserTypeModalComponent } from '../../user-type-modal/user-type-modal.component';

@Component({
  selector: 'app-call-to-action',
  standalone: true,
  imports: [UserTypeModalComponent],
  templateUrl: './call-to-action.component.html',
  styleUrl: './call-to-action.component.css'
})
export class CallToActionComponent {
  @ViewChild(UserTypeModalComponent) userTypeModal!: UserTypeModalComponent;
  @Output() userTypeSelected = new EventEmitter<'candidate' | 'company'>();

  openUserTypeModal() {
    this.userTypeModal.openModal();
  }

  onUserTypeSelected(type: 'candidate' | 'company') {
    this.userTypeSelected.emit(type);
  }
}