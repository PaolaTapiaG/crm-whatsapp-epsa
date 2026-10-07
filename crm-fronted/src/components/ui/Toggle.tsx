import React from 'react';

interface Props {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: string;
}

export const Toggle: React.FC<Props> = ({ checked, onChange, label }) => (
  <label className="flex cursor-pointer items-center gap-2 text-sm text-text-primary">
    <span
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition ${
        checked ? 'bg-[var(--c-online)]' : 'bg-slate-300'
      }`}
    >
      <input
        type="checkbox"
        className="sr-only"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-panel shadow transition ${
          checked ? 'translate-x-4' : 'translate-x-0.5'
        }`}
      />
    </span>
    {label && <span>{label}</span>}
  </label>
);