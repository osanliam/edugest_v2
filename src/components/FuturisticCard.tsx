import { motion } from 'motion/react';
import React from 'react';

interface FuturisticCardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'cyan' | 'magenta' | 'lime' | 'blue' | 'glass';
  glow?: boolean;
  hover?: boolean;
  animated?: boolean;
}

export default function FuturisticCard({
  children,
  className = '',
  variant = 'cyan',
  glow = true,
  hover = true,
  animated = true,
}: FuturisticCardProps) {
  const variantStyles = {
    cyan: {
      border: 'border-cyan-600',
      shadow: 'shadow-glow-cyan',
      bg: 'bg-gradient-to-br from-slate-800 to-slate-900 border-cyan-600/70',
    },
    magenta: {
      border: 'border-fuchsia-600',
      shadow: 'shadow-glow-magenta',
      bg: 'bg-gradient-to-br from-slate-800 to-slate-900 border-fuchsia-600/70',
    },
    lime: {
      border: 'border-lime-600',
      shadow: 'shadow-glow-lime',
      bg: 'bg-gradient-to-br from-slate-800 to-slate-900 border-lime-600/70',
    },
    blue: {
      border: 'border-blue-600',
      shadow: 'shadow-glow-blue',
      bg: 'bg-gradient-to-br from-slate-800 to-slate-900 border-blue-600/70',
    },
    glass: {
      border: 'border-slate-600',
      shadow: 'shadow-glass',
      bg: 'bg-gradient-to-br from-slate-800 to-slate-900',
    },
  };

  const style = variantStyles[variant];

  return (
    <motion.div
      initial={animated ? { opacity: 0, y: 20 } : {}}
      animate={animated ? { opacity: 1, y: 0 } : {}}
      whileHover={hover ? { y: -5, scale: 1.02 } : {}}
      transition={{ duration: 0.3 }}
      className={`
        relative backdrop-blur-xl rounded-2xl
        border-2 ${style.border}
        ${glow ? style.shadow : ''}
        ${style.bg}
        overflow-hidden
        transition-all duration-300
        ${className}
      `}
    >
      {/* Efecto de brillo interno */}
      {glow && (
        <div className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-300">
          <div className={`absolute inset-0 bg-gradient-glass pointer-events-none`}></div>
        </div>
      )}

      {/* Contenido */}
      <div className="relative z-10">
        {children}
      </div>
    </motion.div>
  );
}
