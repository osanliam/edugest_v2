import { motion } from 'motion/react';
import { ReactNode } from 'react';

interface ElegantCardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  gradient?: boolean;
  index?: number;
  onClick?: () => void;
  variant?: 'default' | 'elevated' | 'minimal';
}

export default function ElegantCard({
  children,
  className = '',
  hover = true,
  gradient = false,
  index = 0,
  onClick,
  variant = 'default'
}: ElegantCardProps) {
  const baseClass = variant === 'elevated'
    ? 'glass-card-elevated'
    : variant === 'minimal'
    ? 'bg-slate-800/20 border border-slate-700/30 rounded-xl'
    : 'glass-card';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      whileHover={hover ? { y: -4, boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)' } : {}}
      onClick={onClick}
      className={`${baseClass} p-6 cursor-pointer group ${className}`}
    >
      {gradient && (
        <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-indigo-500/0 via-transparent to-purple-500/0 opacity-0 group-hover:opacity-100 transition-opacity" />
      )}
      <div className="relative z-10">
        {children}
      </div>
    </motion.div>
  );
}
