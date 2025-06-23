import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { User } from '@angular/fire/auth';
import { Skills } from 'src/app/pages/users/candidate/services/candidate.model';
import { FirebaseService } from 'src/app/shared/services/firebase.service';

@Component({
  selector: 'app-canvas-001-skills',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './canvas-001-skills.component.html',
  styleUrls: ['./canvas-001-skills.component.css']
})
export class Canvas001SkillsComponent implements OnInit {
  @Input() currentUser: User | null = null;
  skills: Skills = {};

  constructor(
    private firebaseService: FirebaseService
  ) { }

  ngOnInit(): void {
    this.loadSkills();
  }

  private async loadSkills(): Promise<void> {
    if (!this.currentUser?.email) return;

    try {
      const userData = await this.firebaseService.getUserData(this.firebaseService.formatEmailKey(this.currentUser.email));
      this.skills = userData?.profileData?.skills || {};
    } catch (error) {
      console.error('Error loading skills:', error);
    }
  }

  // Método para dividir las habilidades por comas
  getSkillList(skillsString?: string): string[] {
    return skillsString ? skillsString.split(',').map(s => s.trim()) : [];
  }
}