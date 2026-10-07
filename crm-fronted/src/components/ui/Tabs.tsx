import React from 'react';

interface Props<T extends string> {
  value: T;
  onChange: (v: T) => void;
  items: Array<{ value: T; label: string }>;
  className?: string;
}

export function Tabs<T extends string>({ value, onChange, items, className = '' }: Props<T>) {
  return (
    <div className={`flex items-center gap-1 border-b border-[var(--border-soft)] ${className}`}>
      {items.map((item) => {
        const isActive = item.value === value;
        return (
          <button
            key={item.value}
            type="button"
            onClick={() => onChange(item.value)}
            className={`relative px-3 py-2 text-sm font-semibold transition ${
              isActive
                ? 'text-[var(--c-primary)]'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            {item.label}
            {isActive && (
              <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-[var(--c-primary)]" />
            )}
          </button>
        );
      })}
    </div>
  );
}