import { Component } from '@angular/core';
import { UserTypeModalComponent } from '../../user-type-modal/user-type-modal.component';

@Component({
  selector: 'app-call-to-action',
  standalone: true,
  imports: [UserTypeModalComponent],
  templateUrl: './call-to-action.component.html',
  styleUrl: './call-to-action.component.css'
})
export class CallToActionComponent {

}
