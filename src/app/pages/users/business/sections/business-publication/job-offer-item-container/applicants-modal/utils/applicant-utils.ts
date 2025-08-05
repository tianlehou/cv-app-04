/**
 * Utilidades para el manejo de datos de postulantes
 */

/**
 * Formatea una fecha para mostrarla de manera legible
 * @param date Fecha a formatear
 * @returns Cadena con la fecha formateada
 */
export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return 'N/A';
  
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return 'Fecha inválida';
    
    return d.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    console.error('Error al formatear fecha:', error);
    return 'Error en fecha';
  }
}

/**
 * Mapea un estado interno a un texto legible
 * @param status Estado del postulante
 * @returns Texto legible del estado
 */
export function getStatusText(status: string | null | undefined): string {
  if (!status) return 'Pendiente';
  
  const statusMap: Record<string, string> = {
    'pending': 'Pendiente',
    'reviewed': 'Revisado',
    'interview': 'Entrevistado',
    'interview_scheduled': 'Entrevista agendada',
    'rejected': 'Rechazado',
    'hired': 'Contratado'
  };
  
  return statusMap[status.toLowerCase()] || status;
}

/**
 * Obtiene la clase CSS según el estado del postulante
 * @param status Estado del postulante
 * @returns Nombre de la clase CSS
 */
export function getStatusClass(status: string | null | undefined): string {
  if (!status) return 'status-pending';
  
  switch (status.toLowerCase()) {
    case 'pending':
      return 'status-pending';
    case 'reviewed':
      return 'status-reviewed';
    case 'interview':
    case 'interview_scheduled':
      return 'status-interview';
    case 'rejected':
      return 'status-rejected';
    case 'hired':
      return 'status-hired';
    default:
      return 'status-pending';
  }
}

/**
 * Interfaz para los métodos de utilidad de postulantes
 */
export interface ApplicantUtils {
  formatDate: typeof formatDate;
  getStatusText: typeof getStatusText;
  getStatusClass: typeof getStatusClass;
}

/**
 * Exporta todas las utilidades como un objeto
 */
export const applicantUtils: ApplicantUtils = {
  formatDate,
  getStatusText,
  getStatusClass
};
