import React from 'react';
import { type LucideIcon } from 'lucide-react';

export interface StatWidgetProps {
  label: string;
  value: string | number;
  subtext?: string;
  icon?: LucideIcon;
  color?: 'pink' | 'teal' | 'lavender' | 'peach' | 'ochre' | 'mint' | 'cream' | 'dark';
  className?: string;
}

export const StatWidget: React.FC<StatWidgetProps> = React.memo(({
  label,
  value,
  subtext,
  icon: Icon,
  color = 'cream',
  className = '',
}) => {
  const getWidgetClasses = () => {
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
      className={`relative overflow-hidden rounded-2xl border p-5 transition-all duration-150 gpu-accelerated ${getWidgetClasses()} ${className}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-mono font-bold tracking-wider uppercase opacity-80">
          {label}
        </span>
        {Icon && (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 backdrop-blur-xs">
            <Icon className="h-4 w-4" />
          </div>
        )}
      </div>

      <div className="mt-3">
        <span className="font-['Space_Grotesk'] text-2xl font-extrabold tracking-tight">
          {value}
        </span>
        {subtext && (
          <p className="mt-1 text-xs font-semibold opacity-75">{subtext}</p>
        )}
      </div>
    </div>
  );
});

StatWidget.displayName = 'StatWidget';
