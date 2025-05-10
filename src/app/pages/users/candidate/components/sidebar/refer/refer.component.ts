// refer.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReferLinkComponent } from './refer-link/refer-link.component';
import { FirebaseService } from '../../../../../../shared/services/firebase.service';
import { ToastService } from '../../../../../../shared/services/toast.service';
import { ReferDashboardComponent } from './refer-dashboard/refer-dashboard.component';

@Component({
  selector: 'app-refer',
  standalone: true,
  imports: [CommonModule, ReferLinkComponent, ReferDashboardComponent],
  templateUrl: './refer.component.html',
  styleUrls: ['./refer.component.css'],
  providers: [FirebaseService, ToastService]
})
export class ReferComponent { }