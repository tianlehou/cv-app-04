/**
 * Utilidades para el manejo de texto en la aplicación
 */

export const MAX_PREVIEW_LENGTH = 25;

/**
 * Obtiene una vista previa del texto recortándolo si es necesario
 * @param text Texto a procesar
 * @returns Texto recortado con '...' si es más largo que MAX_PREVIEW_LENGTH
 */
export const getPreviewText = (text: string | undefined): string => {
  if (!text) return '';
  return text.length > MAX_PREVIEW_LENGTH
    ? text.slice(0, MAX_PREVIEW_LENGTH) + '...'
    : text;
};

/**
 * Devuelve el texto completo
 * @param text Texto a devolver
 * @returns El mismo texto de entrada o cadena vacía si es undefined
 */
export const getFullText = (text: string | undefined): string => {
  if (!text) return '';
  return text;
};

/**
 * Verifica si un texto es más largo que el límite de vista previa
 * @param text Texto a verificar
 * @returns true si el texto es más largo que MAX_PREVIEW_LENGTH
 */
export const isTextLong = (text: string | undefined): boolean => {
  if (!text) return false;
  return text.length > MAX_PREVIEW_LENGTH;
};
