export const initials = (name?: string | null): string =>
  (name || 'C')
    .split(' ')
    .filter(Boolean)
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

export const timeHHMM = (value?: string): string => {
  if (!value) return '';
  return new Date(value).toLocaleTimeString('es-BO', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const truncate = (value: string, max = 28): string =>
  value.length > max ? value.slice(0, max) + '…' : value;
