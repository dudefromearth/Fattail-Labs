import type { ReactNode } from 'react';

interface ToastHostProps {
  children: ReactNode;
}

export function ToastHost({ children }: ToastHostProps) {
  return (
    <div style={{
      position: 'fixed',
      bottom: 24,
      right: 24,
      zIndex: 9000,
      display: 'flex',
      flexDirection: 'column-reverse',
      gap: 8,
      pointerEvents: 'none',
    }}>
      {children}
    </div>
  );
}
