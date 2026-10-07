/**
 * Cada par es [regex, reemplazo]. El orden importa: los más específicos
 * van primero para que no sean capturados por patrones más genéricos.
 */
export const CLASS_MAPPINGS = [
  /* ---------------------------------------------------------------- */
  /* Superficies                                                       */
  /* ---------------------------------------------------------------- */
  [/\bbg-white\b(?!\/)/g, 'bg-panel'],
  [/\bbg-slate-50\b(?!\/)/g, 'bg-hover'],
  [/\bbg-slate-100\b(?!\/)/g, 'bg-muted'],
  [/\bbg-slate-200\b(?!\/)/g, 'bg-muted'],
  [/\bbg-slate-900\b(?!\/)/g, 'bg-text-primary'],
  [/\bbg-gray-50\b(?!\/)/g, 'bg-hover'],
  [/\bbg-gray-100\b(?!\/)/g, 'bg-muted'],
  [/\bbg-gray-900\b(?!\/)/g, 'bg-text-primary'],

  [/\bbg-white\/(\d+)\b/g, 'bg-panel/$1'],
  [/\bbg-slate-900\/(\d+)\b/g, 'bg-text-primary/$1'],

  /* ---------------------------------------------------------------- */
  /* Texto                                                             */
  /* ---------------------------------------------------------------- */
  [/\btext-slate-900\b(?!\/)/g, 'text-text-primary'],
  [/\btext-slate-800\b(?!\/)/g, 'text-text-primary'],
  [/\btext-slate-700\b(?!\/)/g, 'text-text-primary'],
  [/\btext-slate-600\b(?!\/)/g, 'text-text-secondary'],
  [/\btext-slate-500\b(?!\/)/g, 'text-text-secondary'],
  [/\btext-slate-400\b(?!\/)/g, 'text-text-muted'],
  [/\btext-slate-300\b(?!\/)/g, 'text-text-muted'],
  [/\btext-gray-900\b(?!\/)/g, 'text-text-primary'],
  [/\btext-gray-700\b(?!\/)/g, 'text-text-primary'],
  [/\btext-gray-500\b(?!\/)/g, 'text-text-secondary'],

  /* ---------------------------------------------------------------- */
  /* Bordes                                                            */
  /* ---------------------------------------------------------------- */
  [/\bborder-slate-200\b/g, 'border-border-soft'],
  [/\bborder-slate-300\b/g, 'border-border-mid'],
  [/\bborder-slate-400\b/g, 'border-border-strong'],
  [/\bborder-gray-200\b/g, 'border-border-soft'],
  [/\bborder-gray-300\b/g, 'border-border-mid'],
  [/\bborder-white\b/g, 'border-panel'],
  [/\bborder-white\/(\d+)\b/g, 'border-panel/$1'],
  [/\bring-white\b/g, 'ring-panel'],
  [/\bring-slate-100\b/g, 'ring-primary-border'],
  [/\bring-slate-200\b/g, 'ring-border-soft'],

  /* ---------------------------------------------------------------- */
  /* Primario (sky → primary)                                          */
  /* ---------------------------------------------------------------- */
  [/\bbg-sky-600\b/g, 'bg-primary'],
  [/\bbg-sky-500\b/g, 'bg-primary'],
  [/\bbg-sky-100\b/g, 'bg-primary-soft'],
  [/\bbg-sky-50\b/g, 'bg-primary-soft'],
  [/\btext-sky-700\b/g, 'text-primary'],
  [/\btext-sky-600\b/g, 'text-primary'],
  [/\btext-sky-500\b/g, 'text-primary'],
  [/\bborder-sky-200\b/g, 'border-primary-border'],
  [/\bborder-sky-100\b/g, 'border-primary-border'],
  [/\bborder-sky-300\b/g, 'border-primary-border'],
  [/\bhover:bg-sky-50\b/g, 'hover:bg-primary-soft'],
  [/\bhover:bg-sky-100\b/g, 'hover:bg-primary-soft'],
  [/\bhover:border-sky-300\b/g, 'hover:border-primary-border'],

  /* ---------------------------------------------------------------- */
  /* Estados                                                           */
  /* ---------------------------------------------------------------- */
  [/\bbg-emerald-500\b/g, 'bg-online'],
  [/\bbg-emerald-50\b/g, 'bg-online-soft'],
  [/\btext-emerald-600\b/g, 'text-online'],
  [/\btext-emerald-700\b/g, 'text-online'],
  [/\bborder-emerald-200\b/g, 'border-online'],

  [/\bbg-amber-500\b/g, 'bg-pending'],
  [/\bbg-amber-50\b/g, 'bg-pending-soft'],
  [/\bbg-amber-100\b/g, 'bg-pending-soft'],
  [/\btext-amber-700\b/g, 'text-pending'],
  [/\btext-amber-600\b/g, 'text-pending'],
  [/\btext-amber-900\b/g, 'text-pending'],
  [/\btext-amber-950\b/g, 'text-pending'],
  [/\bborder-amber-200\b/g, 'border-pending'],

  [/\bbg-rose-500\b/g, 'bg-danger'],
  [/\bbg-rose-50\b/g, 'bg-danger-soft'],
  [/\bbg-red-500\b/g, 'bg-danger'],
  [/\btext-rose-600\b/g, 'text-danger'],
  [/\btext-red-500\b/g, 'text-danger'],
  [/\bborder-rose-300\b/g, 'border-danger'],

  [/\bbg-slate-400\b/g, 'bg-closed'],
];

export const CLASS_ATTR_PATTERNS = [
  /className\s*=\s*"([^"]*)"/g,
  /className\s*=\s*'([^']*)'/g,
  /className\s*=\s*\{`([^`]*)`\}/g,
  /className\s*=\s*\{'([^']*)'\}/g,
  /className\s*=\s*\{"([^"]*)"\}/g,
];

export default CLASS_MAPPINGS;
