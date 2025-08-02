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
