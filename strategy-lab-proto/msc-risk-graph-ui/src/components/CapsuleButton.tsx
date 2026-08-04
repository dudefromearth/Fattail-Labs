interface CapsuleButtonProps {
  label: string;
  active?: boolean;
  color?: 'accent' | 'danger' | 'warning' | 'success' | 'purple';
  onClick?: () => void;
  disabled?: boolean;
  compact?: boolean;
  title?: string;
}

export function CapsuleButton({
  label,
  active = false,
  color = 'accent',
  onClick,
  disabled = false,
  compact = false,
  title,
}: CapsuleButtonProps) {
  const classes = [
    'capsule-button',
    active ? 'active' : '',
    active && color !== 'accent' ? `color-${color}` : '',
    compact ? 'compact' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button className={classes} onClick={onClick} disabled={disabled} title={title}>
      {label}
    </button>
  );
}
