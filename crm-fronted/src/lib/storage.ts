export const readStored = <T,>(key: string, fallback: T): T => {
  try {
    const value = localStorage.getItem(key);
    if (!value) return fallback;
    const parsed = JSON.parse(value);
    return typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)
      ? { ...fallback, ...parsed }
      : parsed;
  } catch {
    return fallback;
  }
};

export const writeStored = <T,>(key: string, value: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // quota / private mode
  }
};