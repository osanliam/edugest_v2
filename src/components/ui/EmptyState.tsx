import { type ReactNode } from 'react';
import { motion } from 'motion/react';
import { LucideIcon, Search, FileX, Users, BookOpen, AlertCircle, Inbox } from 'lucide-react';
import { Button } from './Button';

export type EmptyVariant = 'search' | 'no-data' | 'no-users' | 'no-courses' | 'error' | 'inbox';

const emptyConfigs: Record<EmptyVariant, { icon: LucideIcon; color: string; defaultTitle: string; defaultDesc: string }> = {
  search: {
    icon: Search,
    color: 'text-slate-400',
    defaultTitle: 'Sin resultados',
    defaultDesc: 'No encontramos coincidencias con tu búsqueda.',
  },
  'no-data': {
    icon: FileX,
    color: 'text-slate-400',
    defaultTitle: 'Sin datos',
    defaultDesc: 'Aún no hay información registrada aquí.',
  },
  'no-users': {
    icon: Users,
    color: 'text-slate-400',
    defaultTitle: 'Sin usuarios',
    defaultDesc: 'No hay usuarios que mostrar.',
  },
  'no-courses': {
    icon: BookOpen,
    color: 'text-slate-400',
    defaultTitle: 'Sin cursos',
    defaultDesc: 'No hay cursos configurados todavía.',
  },
  error: {
    icon: AlertCircle,
    color: 'text-rose-400',
    defaultTitle: 'Error al cargar',
    defaultDesc: 'Algo salió mal. Intenta de nuevo.',
  },
  inbox: {
    icon: Inbox,
    color: 'text-slate-400',
    defaultTitle: 'Bandeja vacía',
    defaultDesc: 'No hay elementos aquí.',
  },
};

interface EmptyStateProps {
  variant?: EmptyVariant;
  icon?: LucideIcon;
  title?: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary';
  };
  children?: ReactNode;
  className?: string;
}

export function EmptyState({
  variant = 'no-data',
  icon: CustomIcon,
  title,
  description,
  action,
  children,
  className = '',
}: EmptyStateProps) {
  const cfg = emptyConfigs[variant];
  const Icon = CustomIcon || cfg.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={`
        flex flex-col items-center justify-center text-center py-16 px-6
        ${className}
      `}
    >
      <motion.div
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
        className={`
          w-16 h-16 rounded-2xl
          bg-slate-800/60 border border-slate-700/30
          flex items-center justify-center mb-5
        `}
      >
        <Icon className={`w-8 h-8 ${cfg.color}`} strokeWidth={1.5} />
      </motion.div>

      <h3 className="text-base font-bold text-white mb-2">
        {title || cfg.defaultTitle}
      </h3>

      <p className="text-sm text-slate-400 max-w-xs leading-relaxed mb-6">
        {description || cfg.defaultDesc}
      </p>

      {action && (
        <Button
          variant={action.variant || 'primary'}
          size="md"
          onClick={action.onClick}
        >
          {action.label}
        </Button>
      )}

      {children}
    </motion.div>
  );
}

// ─── Skeleton Loader ───────────────────────────────────────────────────────────

interface SkeletonProps {
  className?: string;
  lines?: number;
}

export function Skeleton({ className = '', lines = 3 }: SkeletonProps) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0.3 }}
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            delay: i * 0.15,
            ease: 'easeInOut',
          }}
          className="h-4 bg-slate-700/50 rounded-lg"
          style={{ width: `${Math.random() * 40 + 60}%` }}
        />
      ))}
    </div>
  );
}
