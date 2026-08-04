import React from 'react';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
}

export function GlassCard({ children, className = '' }: GlassCardProps) {
  const classes = ['glass-card', className].filter(Boolean).join(' ');

  return (
    <div className={classes}>
      {children}
    </div>
  );
}
