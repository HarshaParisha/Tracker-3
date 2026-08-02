import React from 'react';

export interface CardProps {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  variant?: 'solid' | 'soft' | 'outline';
  color?: 'pink' | 'teal' | 'lavender' | 'peach' | 'ochre' | 'mint' | 'cream' | 'dark';
  className?: string;
  action?: React.ReactNode;
}

export const Card: React.FC<CardProps> = React.memo(({
  title,
  subtitle,
  children,
  variant = 'solid',
  color = 'cream',
  className = '',
  action,
}) => {
  const getCardClasses = () => {
    switch (color) {
      case 'pink':
        return 'bg-[#ff4d8b] text-white border-[#ff4d8b]';
      case 'teal':
        return 'bg-[#1a3a3a] text-white border-[#1a3a3a]';
      case 'lavender':
        return 'bg-[#b8a4ed] text-[#0a0a0a] border-[#b8a4ed]';
      case 'peach':
        return 'bg-[#ffb084] text-[#0a0a0a] border-[#ffb084]';
      case 'ochre':
        return 'bg-[#e8b94a] text-[#0a0a0a] border-[#e8b94a]';
      case 'mint':
        return 'bg-[#a4d4c5] text-[#0a0a0a] border-[#a4d4c5]';
      case 'dark':
        return 'bg-[var(--surface-dark)] text-white border-[var(--surface-dark)]';
      case 'cream':
      default:
        return 'bg-[var(--surface-card)] text-[var(--ink)] border-[var(--hairline)]';
    }
  };

  return (
    <div
      className={`rounded-2xl border p-5 transition-all duration-150 gpu-accelerated ${
        variant === 'outline' ? 'bg-transparent' : getCardClasses()
      } ${className}`}
    >
      {(title || subtitle || action) && (
        <div className="mb-4 flex items-start justify-between">
          <div>
            {title && (
              <h3 className="font-['Space_Grotesk'] text-base font-extrabold tracking-tight">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="mt-0.5 text-xs font-semibold opacity-75">{subtitle}</p>
            )}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      <div>{children}</div>
    </div>
  );
});

Card.displayName = 'Card';
