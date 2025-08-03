const MAX_PREVIEW_LENGTH = 25;

export const getPreviewText = (text: string | undefined): string => {
  if (!text) return '';
  return text.length > MAX_PREVIEW_LENGTH
    ? text.slice(0, MAX_PREVIEW_LENGTH) + '...'
    : text;
};

export const getFullText = (text: string | undefined): string => {
  if (!text) return '';
  return text;
};

export const isTextLong = (text: string | undefined): boolean => {
  if (!text) return false;
  return text.length > MAX_PREVIEW_LENGTH;
};

export const getModalityLabel = (modality: string): string => {
  const modalities: { [key: string]: string } = {
    'remoto': 'Remoto',
    'presencial': 'Presencial',
    'hibrido': 'Híbrido',
  };
  return modalities[modality.toLowerCase()] || modality;
};

export const getContractTypeLabel = (contractType: string): string => {
  const types: { [key: string]: string } = {
    'indefinido': 'Indefinido',
    'temporal': 'Temporal',
    'practicas': 'Prácticas',
    'formacion': 'Formación',
  };
  return types[contractType.toLowerCase()] || contractType;
};

export const getWorkdayLabel = (workday: string): string => {
  const workdays: { [key: string]: string } = {
    'completa': 'Jornada Completa',
    'parcial': 'Media Jornada',
    'por-horas': 'Por Horas',
  };
  return workdays[workday.toLowerCase()] || workday;
};

export const formatSalary = (value: string | number | null, mode: 'input' | 'blur' = 'blur'): string => {
  // Manejar valores nulos o vacíos
  if (value === null || value === '') return '';
  
  // Convertir a string si es número
  const stringValue = typeof value === 'number' ? value.toString() : value;
  
  // Limpiar caracteres no numéricos excepto el punto decimal
  let cleanValue = stringValue.replace(/[^0-9.]/g, '');
  
  // Si hay más de un punto, mantener solo el último
  const decimalSplit = cleanValue.split('.');
  if (decimalSplit.length > 2) {
    cleanValue = `${decimalSplit.slice(0, -1).join('')}.${decimalSplit[decimalSplit.length - 1]}`;
  }
  
  // Si es modo input, devolver el valor limpio sin formatear
  if (mode === 'input') {
    return cleanValue;
  }
  
  // Para modo blur, formatear el número
  // Limpiar comas existentes
  cleanValue = cleanValue.replace(/,/g, '');
  const numberValue = parseFloat(cleanValue);
  
  // Si no es un número válido, devolver el valor original
  if (isNaN(numberValue)) return stringValue;
  
  // Formatear con comas para miles y dos decimales
  return numberValue.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};