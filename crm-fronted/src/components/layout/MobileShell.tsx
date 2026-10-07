import React from 'react';

export const MobileShell: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <div className="min-h-screen bg-[var(--color-background)] md:hidden">{children}</div>
);

export default MobileShell;
