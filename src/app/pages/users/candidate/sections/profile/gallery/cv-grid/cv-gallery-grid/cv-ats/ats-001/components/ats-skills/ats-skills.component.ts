import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { User } from '@angular/fire/auth';
import { FirebaseService } from 'src/app/shared/services/firebase.service';

@Component({
  selector: 'app-ats-skills',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ats-skills.component.html',
  styleUrls: ['./ats-skills.component.css'],
})
export class AtsSkillsComponent implements OnInit {
  @Input() currentUser: User | null = null;
  skills: any = {};

  constructor(private firebaseService: FirebaseService) { }

  ngOnInit(): void {
    this.loadSkills();
  }

  private async loadSkills(): Promise<void> {
    if (!this.currentUser?.email) return;

    try {
      const formattedEmail = this.firebaseService.formatEmailKey(this.currentUser.email);
      const userData = await this.firebaseService.getUserData(formattedEmail);
      this.skills = userData?.profileData?.skills || {};
    } catch (error) {
      console.error('Error al cargar habilidades:', error);
    }
  }

  // Método para dividir las habilidades por comas
  getSkillList(skillsString?: string): string[] {
    return skillsString ? skillsString.split(',').map(s => s.trim()) : [];
  }
}