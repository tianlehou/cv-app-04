/**
 * Formatea una fecha en un string legible
 * @param dateString Fecha en formato ISO o string de fecha válido
 * @returns String con la fecha formateada o 'No especificada' si no hay fecha
 */
export function formatDate(dateString: string | undefined | null): string {
  if (!dateString) return 'No especificada';
  
  const options: Intl.DateTimeFormatOptions = {
    year: '2-digit',
    month: 'short',
    day: '2-digit',
  };
  
  return new Date(dateString).toLocaleDateString('es-ES', options);
}

export function formatDateWithHour(dateString: string | undefined | null): string {
  if (!dateString) return 'No especificada';
  
  const options: Intl.DateTimeFormatOptions = {
    year: '2-digit',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  };
  
  return new Date(dateString).toLocaleDateString('es-ES', options);
}