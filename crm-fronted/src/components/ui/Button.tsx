import React from 'react';

type Variant = 'primary' | 'outline' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  icon?: React.ReactNode;
}

const VARIANTS: Record<Variant, string> = {
  primary:
    'bg-[var(--c-primary)] text-white hover:bg-[var(--c-primary-dark)] shadow-sm',
  outline:
    'border border-[var(--border-mid)] bg-white text-slate-700 hover:bg-[var(--bg-hover)]',
  ghost: 'text-slate-600 hover:bg-[var(--bg-hover)]',
  danger: 'bg-[var(--c-danger)] text-white hover:opacity-90',
};

const SIZES: Record<Size, string> = {
  sm: 'h-8 px-3 text-xs',
  md: 'h-10 px-4 text-sm',
  lg: 'h-11 px-5 text-sm',
};

export const Button: React.FC<Props> = ({
  variant = 'primary',
  size = 'md',
  icon,
  children,
  className = '',
  ...rest
}) => (
  <button
    {...rest}
    className={`inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
  >
    {icon}
    {children}
  </button>
);