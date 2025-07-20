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
  applications?: string[]; // IDs de los usuarios que han aplicado
  views?: number; // Número de visualizaciones
  experienceLevel?: 'trainee' | 'junior' | 'mid' | 'senior' | 'expert';
  // Metadatos
  createdAt?: Date | string;
  updatedAt?: Date | string;
}
