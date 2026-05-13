import { type HTMLAttributes, type ReactNode } from 'react';
import { motion, type HTMLMotionProps } from 'motion/react';
import { LucideIcon } from 'lucide-react';

// ─── Card variants ─────────────────────────────────────────────────────────────

export type CardVariant = 'default' | 'elevated' | 'minimal' | 'bordered';
export type CardAccent = 'indigo' | 'cyan' | 'emerald' | 'amber' | 'rose' | 'purple' | 'none';

const baseClasses = 'rounded-2xl overflow-hidden';

// ─── Glass / Default Card ──────────────────────────────────────────────────────

interface CardProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  children: ReactNode;
  variant?: CardVariant;
  accent?: CardAccent;
  hover?: boolean;
  header?: ReactNode;
  footer?: ReactNode;
}

const accentColors: Record<CardAccent, string> = {
  indigo: 'border-indigo-500/30',
  cyan:   'border-cyan-500/30',
  emerald:'border-emerald-500/30',
  amber:  'border-amber-500/30',
  rose:   'border-rose-500/30',
  purple: 'border-purple-500/30',
  none:   'border-slate-700/30',
};

const variants: Record<CardVariant, string> = {
  default: `
    bg-gradient-to-br from-slate-800/80 to-slate-900/80
    backdrop-blur-xl border
    shadow-xl
  `,
  elevated: `
    bg-gradient-to-br from-slate-700/90 to-slate-800/95
    backdrop-blur-xl border
    shadow-2xl
  `,
  minimal: `
    bg-slate-800/40 border border-slate-700/20
  `,
  bordered: `
    bg-slate-900/60 border border-slate-700/40
    shadow-lg
  `,
};

export function Card({
  children,
  variant = 'default',
  accent = 'none',
  hover = false,
  header,
  footer,
  className = '',
  ...props
}: CardProps) {
  const Wrapper = hover ? motion.div : 'div';
  const wrapperProps = hover
    ? { whileHover: { y: -3, boxShadow: '0 20px 40px rgba(0,0,0,0.4)' } }
    : {};

  return (
    <Wrapper
      {...wrapperProps}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className={`
        ${baseClasses}
        ${variants[variant]}
        ${accentColors[accent]}
        ${className}
      `}
      {...props}
    >
      {header && (
        <div className="px-5 py-4 border-b border-slate-700/30 bg-slate-800/30">
          {header}
        </div>
      )}
      <div className="p-5">{children}</div>
      {footer && (
        <div className="px-5 py-4 border-t border-slate-700/30 bg-slate-800/20">
          {footer}
        </div>
      )}
    </Wrapper>
  );
}

// ─── Stat Card ─────────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  accent?: CardAccent;
  trend?: { value: number; positive: boolean };
  onClick?: () => void;
}

export function StatCard({ label, value, icon: Icon, accent = 'indigo', trend, onClick }: StatCardProps) {
  const accentStyles: Record<CardAccent, { from: string; to: string; icon: string }> = {
    indigo:  { from: 'from-indigo-500/20', to: 'to-indigo-600/10', icon: 'text-indigo-400' },
    cyan:    { from: 'from-cyan-500/20',   to: 'to-cyan-600/10',   icon: 'text-cyan-400' },
    emerald: { from: 'from-emerald-500/20',to: 'to-emerald-600/10',icon: 'text-emerald-400' },
    amber:   { from: 'from-amber-500/20',  to: 'to-amber-600/10',  icon: 'text-amber-400' },
    rose:    { from: 'from-rose-500/20',   to: 'to-rose-600/10',   icon: 'text-rose-400' },
    purple:  { from: 'from-purple-500/20', to: 'to-purple-600/10', icon: 'text-purple-400' },
    none:    { from: 'from-slate-500/10',  to: 'to-slate-600/5',   icon: 'text-slate-400' },
  };

  const s = accentStyles[accent];

  return (
    <motion.div
      whileHover={onClick ? { scale: 1.02, y: -2 } : {}}
      whileTap={onClick ? { scale: 0.98 } : {}}
      onClick={onClick}
      className={`
        relative overflow-hidden rounded-2xl p-5 cursor-pointer
        bg-gradient-to-br ${s.from} ${s.to}
        border ${accentColors[accent]}
        shadow-lg hover:shadow-xl
        transition-shadow duration-200
        ${onClick ? 'cursor-pointer' : ''}
      `}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{label}</p>
          <p className="text-3xl font-black text-white mt-1">{value}</p>
          {trend && (
            <p className={`text-xs font-semibold mt-1 ${trend.positive ? 'text-emerald-400' : 'text-rose-400'}`}>
              {trend.positive ? '↑' : '↓'} {Math.abs(trend.value)}%
            </p>
          )}
        </div>
        {Icon && (
          <div className={`${s.icon} bg-slate-800/50 rounded-xl p-2.5`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ─── Section Card ──────────────────────────────────────────────────────────────

interface SectionCardProps {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  accent?: CardAccent;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function SectionCard({
  title,
  subtitle,
  icon: Icon,
  accent = 'none',
  actions,
  children,
  className = '',
}: SectionCardProps) {
  return (
    <Card variant="default" accent={accent} className={className}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          {Icon && (
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
              accent === 'indigo' ? 'bg-indigo-500/20 text-indigo-400' :
              accent === 'cyan'   ? 'bg-cyan-500/20 text-cyan-400' :
              accent === 'emerald'? 'bg-emerald-500/20 text-emerald-400' :
              accent === 'amber'  ? 'bg-amber-500/20 text-amber-400' :
              accent === 'rose'   ? 'bg-rose-500/20 text-rose-400' :
              accent === 'purple' ? 'bg-purple-500/20 text-purple-400' :
              'bg-slate-500/20 text-slate-400'
            }`}>
              <Icon className="w-4.5 h-4.5" />
            </div>
          )}
          <div>
            <h3 className="text-sm font-bold text-white">{title}</h3>
            {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
          </div>
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
      {children}
    </Card>
  );
}
