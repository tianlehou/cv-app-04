import { Injectable } from '@angular/core';

export interface MatchResult {
  percentage: number;
  categoryScores: {
    profession: number;
    skills: number;
    experience: number;
    education: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class MatchService {
  private readonly weights = {
    profession: 0.4,    // 40% de peso
    skills: 0.3,        // 30% de peso
    experience: 0.2,    // 20% de peso
    education: 0.1      // 10% de peso
  };

  constructor() { }

  /**
   * Calcula el porcentaje de coincidencia entre el perfil del candidato y la oferta de trabajo
   * @param applicant Perfil del candidato
   * @param jobOffer Oferta de trabajo
   * @returns Objeto con el porcentaje total y puntuaciones por categoría
   */
  calculateMatch(applicant: any, jobOffer: any): MatchResult {
    if (!jobOffer) {
      return { percentage: 0, categoryScores: { profession: 0, skills: 0, experience: 0, education: 0 } };
    }

    const result: MatchResult = {
      percentage: 0,
      categoryScores: {
        profession: this.calculateProfessionMatch(applicant, jobOffer),
        skills: this.calculateSkillsMatch(applicant, jobOffer),
        experience: this.calculateExperienceMatch(applicant, jobOffer),
        education: this.calculateEducationMatch(applicant, jobOffer)
      }
    };

    // Calcular puntuación total ponderada
    let totalScore = 0;
    let maxScore = 0;

    Object.entries(this.weights).forEach(([key, weight]) => {
      totalScore += (result.categoryScores as any)[key] * weight;
      maxScore += 100 * weight;
    });

    // Asegurar que el porcentaje esté entre 0 y 100
    result.percentage = Math.round((totalScore / Math.max(1, maxScore)) * 100);
    result.percentage = Math.min(100, Math.max(0, result.percentage));

    return result;
  }

  /**
   * Obtiene la clase CSS para el nivel de coincidencia
   */
  getMatchClass(matchPercentage: number): string {
    if (matchPercentage >= 80) return 'match-high';
    if (matchPercentage >= 50) return 'match-medium';
    return 'match-low';
  }

  private calculateProfessionMatch(applicant: any, jobOffer: any): number {
    if (!jobOffer.profession || !applicant.profesion) return 0;
    
    const jobProfessions = jobOffer.profession.toLowerCase().split(/[,\s]+/);
    const applicantProfession = applicant.profesion.toLowerCase();
    
    return jobProfessions.some((prof: string) => applicantProfession.includes(prof)) ? 100 : 0;
  }

  private calculateSkillsMatch(applicant: any, jobOffer: any): number {
    if (!jobOffer.skills || !applicant.skills) return 0;
    
    const jobSkills = jobOffer.skills.map((s: string) => s.toLowerCase());
    const applicantSkills = Array.isArray(applicant.skills) 
      ? applicant.skills.map((s: any) => typeof s === 'string' ? s.toLowerCase() : s.name?.toLowerCase() || '')
      : [];
    
    const commonSkills = jobSkills.filter((skill: string) => 
      applicantSkills.some((applicantSkill: string) => 
        applicantSkill.includes(skill) || skill.includes(applicantSkill)
      )
    );
    
    return jobSkills.length > 0 ? (commonSkills.length / jobSkills.length) * 100 : 0;
  }

  private calculateExperienceMatch(applicant: any, jobOffer: any): number {
    if (!jobOffer.experienceRequired || !applicant.experience) return 0;
    
    const requiredExp = parseInt(jobOffer.experienceRequired) || 0;
    const applicantExp = parseInt(applicant.experience) || 0;
    
    if (applicantExp >= requiredExp) {
      return 100;
    } else if (requiredExp > 0) {
      // Ponderación parcial basada en qué tan cerca está de los años requeridos
      return (applicantExp / requiredExp) * 100;
    }
    
    return 0;
  }

  private calculateEducationMatch(applicant: any, jobOffer: any): number {
    if (!jobOffer.educationLevel || !applicant.education) return 0;
    
    const educationLevels = ['secundaria', 'técnico', 'universitario', 'posgrado', 'maestría', 'doctorado'];
    const jobEduIndex = educationLevels.findIndex(level => 
      jobOffer.educationLevel.toLowerCase().includes(level)
    );
    
    if (jobEduIndex === -1) return 0;
    
    const applicantEduIndex = educationLevels.findIndex(level => 
      applicant.education.some((edu: any) => 
        (edu.degree || '').toLowerCase().includes(level) ||
        (edu.fieldOfStudy || '').toLowerCase().includes(level)
      )
    );
    
    if (applicantEduIndex === -1) return 0;
    
    if (applicantEduIndex >= jobEduIndex) {
      return 100;
    } else {
      // Ponderación parcial basada en el nivel educativo
      return (applicantEduIndex / jobEduIndex) * 100;
    }
  }
}
