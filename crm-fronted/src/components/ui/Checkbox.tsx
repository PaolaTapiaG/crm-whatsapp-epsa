import React from 'react';

export const Checkbox: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => (
  <input
    type="checkbox"
    className="h-4 w-4 rounded border-border-mid text-[var(--color-primary)] focus:ring-sky-500"
    {...props}
  />
);

export default Checkbox;
