import React from 'react';

export const DesktopShell: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <div className="hidden min-h-screen bg-[var(--color-background)] md:flex">{children}</div>
);

export default DesktopShell;
