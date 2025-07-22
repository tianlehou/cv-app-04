import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-landing-business',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './landing-business.component.html',
  styleUrls: ['./landing-business.component.css']
})
export class LandingBusinessComponent {
  // Lógica del componente si es necesario
}
