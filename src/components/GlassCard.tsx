import { motion } from "motion/react";
import { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  title?: string;
  icon?: LucideIcon;
  variant?: 'cyan' | 'magenta' | 'lime' | 'blue' | 'gray';
  key?: string | number;
}

export function GlassCard({ children, className = "", title, icon: Icon, variant = 'blue' }: GlassCardProps) {
  const borderColors = {
    cyan: "border-cyan-500/30",
    magenta: "border-magenta-500/30",
    lime: "border-lime-500/30",
    blue: "border-blue-500/30",
    gray: "border-white/10"
  };

  const glows = {
    cyan: "shadow-[0_0_15px_rgba(6,182,212,0.1)]",
    magenta: "shadow-[0_0_15px_rgba(217,70,239,0.1)]",
    lime: "shadow-[0_0_15px_rgba(132,204,22,0.1)]",
    blue: "shadow-[0_0_15px_rgba(59,130,246,0.1)]",
    gray: ""
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`glass-card p-5 ${borderColors[variant]} ${glows[variant]} ${className}`}
    >
      {(title || Icon) && (
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            {Icon && <Icon className={`w-5 h-5 text-neon-${variant}`} />}
            {title && <h3 className="text-sm font-semibold tracking-wider uppercase opacity-80">{title}</h3>}
          </div>
          <div className="text-white/20 hover:text-white/40 cursor-pointer">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-4 h-4 text-white/50">
              <circle cx="12" cy="5" r="1" />
              <circle cx="12" cy="12" r="1" />
              <circle cx="12" cy="19" r="1" />
            </svg>
          </div>
        </div>
      )}
      {children}
    </motion.div>
  );
}
