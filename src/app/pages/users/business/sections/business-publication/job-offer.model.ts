export interface JobOffer {
  id?: string; // Opcional, será generado por Firebase
  title: string;
  deadline: string; // Fecha en formato ISO string
  description: string;
  requirements: string;
  contractType: 'indefinido' | 'temporal' | 'practicas' | 'formacion';
  workday: 'completa' | 'parcial' | 'por-horas';
  salary: number;
  location: string;
  modality: 'presencial' | 'remoto' | 'hibrido';
  companyId: string;
  companyName: string;
  status: 'borrador' | 'publicado' | 'vencido'; // Estado de la oferta
  publicationDate?: string; // Fecha en formato ISO string - opcional para borradores
  views?: number; // Número de visualizaciones
  experienceLevel?: 'trainee' | 'junior' | 'mid' | 'senior' | 'expert';

  likes?: number; // Contador de likes
  userLiked?: boolean; // Indica si el usuario actual ha dado like a esta oferta

  saves?: number;
  userSaved?: boolean;

  applications?: number;// IDs de los usuarios que han aplicado
  appliedBy?: boolean;
  hasApplied?: boolean; // Indica si el usuario actual ha aplicado a esta oferta
  // Metadatos
  createdAt?: Date | string;
  updatedAt?: Date | string;
}
