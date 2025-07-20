export interface JobOffer {
  id?: string; // Opcional, será generado por Firebase
  title: string;
  description: string;
  requirements: string;
  contractType: 'indefinido' | 'temporal' | 'practicas' | 'formacion';
  workday: 'completa' | 'parcial' | 'por-horas';
  salary: number;
  location: string;
  modality: 'presencial' | 'remoto' | 'hibrido';
  deadline: string; // Fecha en formato ISO string
  companyId: string;
  companyName: string;
  status: 'borrador' | 'publicado' | 'vencido'; // Estado de la oferta
  publicationDate?: string; // Fecha en formato ISO string - opcional para borradores
  isActive: boolean;
  applicants?: string[]; // IDs de los usuarios que han aplicado
  views?: number; // Número de visualizaciones
  skills?: string[]; // Habilidades requeridas
  experienceLevel?: 'trainee' | 'junior' | 'mid' | 'senior' | 'expert';
  educationRequired?: string; // Nivel de estudios requerido
  languages?: Array<{
    name: string;
    level: 'basico' | 'intermedio' | 'avanzado' | 'nativo';
  }>;
  benefits?: string[]; // Beneficios del trabajo
  remoteWork?: boolean; // Si el trabajo es remoto
  travelRequired?: boolean; // Si se requiere viajar
  availability?: string; // Disponibilidad requerida
  // Metadatos
  createdAt?: Date | string;
  updatedAt?: Date | string;
}
