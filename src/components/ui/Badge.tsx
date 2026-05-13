import { type HTMLAttributes } from 'react';
import { motion } from 'motion/react';

// ─── Badge variants ─────────────────────────────────────────────────────────────

export type BadgeVariant =
  | 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info'
  | 'indigo'  | 'cyan'    | 'emerald' | 'amber'    | 'rose'    | 'purple';

export type BadgeSize = 'sm' | 'md';

const badgeStyles: Record<BadgeVariant, string> = {
  default: 'bg-slate-700/80 text-slate-300 border-slate-600/50',
  primary: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
  success: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  warning: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  danger:  'bg-red-500/20 text-red-300 border-red-500/30',
  info:    'bg-blue-500/20 text-blue-300 border-blue-500/30',
  indigo:  'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
  cyan:    'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
  emerald: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  amber:   'bg-amber-500/20 text-amber-300 border-amber-500/30',
  rose:    'bg-rose-500/20 text-rose-300 border-rose-500/30',
  purple:  'bg-purple-500/20 text-purple-300 border-purple-500/30',
};

const sizes: Record<BadgeSize, string> = {
  sm: 'px-1.5 py-0.5 text-[10px] gap-1 rounded-md',
  md: 'px-2 py-1 text-xs gap-1.5 rounded-lg',
};

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
  pulse?: boolean;
  icon?: React.ReactNode;
}

export function Badge({
  variant = 'default',
  size = 'md',
  dot = false,
  pulse = false,
  icon,
  className = '',
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={`
        inline-flex items-center font-semibold border
        ${badgeStyles[variant]}
        ${sizes[size]}
        ${className}
      `}
      {...props}
    >
      {dot && (
        <span
          className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
            pulse ? 'animate-pulse' : ''
          } ${
            variant === 'success' || variant === 'emerald' ? 'bg-emerald-400' :
            variant === 'warning' || variant === 'amber' ? 'bg-amber-400' :
            variant === 'danger' || variant === 'rose' ? 'bg-red-400' :
            variant === 'info' || variant === 'cyan' ? 'bg-cyan-400' :
            variant === 'indigo' || variant === 'purple' ? 'bg-indigo-400' :
            'bg-slate-400'
          }`}
        />
      )}
      {icon && <span className="flex-shrink-0">{icon}</span>}
      {children}
    </span>
  );
}

// ─── Calificativo Badge (AD/A/B/C) ────────────────────────────────────────────

interface CalificativoBadgeProps {
  value: 'AD' | 'A' | 'B' | 'C' | string;
  size?: BadgeSize;
}

export function CalificativoBadge({ value, size = 'md' }: CalificativoBadgeProps) {
  const configs: Record<string, { bg: string; text: string; label: string }> = {
    AD: { bg: 'bg-violet-500/20 border-violet-500/30', text: 'text-violet-300', label: 'Logro Destacado' },
    A:  { bg: 'bg-emerald-500/20 border-emerald-500/30', text: 'text-emerald-300', label: 'Logro Esperado' },
    B:  { bg: 'bg-amber-500/20 border-amber-500/30', text: 'text-amber-300', label: 'En Proceso' },
    C:  { bg: 'bg-red-500/20 border-red-500/30', text: 'text-red-300', label: 'En Inicio' },
  };
  const cfg = configs[value] || configs.C;

  return (
    <motion.span
      whileHover={{ scale: 1.1 }}
      title={cfg.label}
      className={`
        inline-flex items-center justify-center font-black border
        ${cfg.bg} ${cfg.text}
        px-2 py-1 text-xs rounded-lg min-w-[2.5rem]
      `}
    >
      {value}
    </motion.span>
  );
}

// ─── Status Dot ───────────────────────────────────────────────────────────────

interface StatusDotProps {
  status: 'online' | 'offline' | 'syncing' | 'error';
  label?: string;
}

export function StatusDot({ status, label }: StatusDotProps) {
  const styles: Record<string, { dot: string; label: string }> = {
    online:  { dot: 'bg-emerald-400 animate-pulse',  label: 'text-emerald-400' },
    offline: { dot: 'bg-slate-500',                  label: 'text-slate-400' },
    syncing:{ dot: 'bg-cyan-400 animate-ping',        label: 'text-cyan-400' },
    error:  { dot: 'bg-red-400',                     label: 'text-red-400' },
  };
  const s = styles[status] || styles.offline;

  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${s.label}`}>
      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${s.dot}`} />
      {label}
    </span>
  );
}
