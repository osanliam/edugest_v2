import { LucideIcon } from 'lucide-react';
import { motion } from 'motion/react';

interface ModuleHeaderProps {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  badge?: string;
  badgeColor?: 'blue' | 'green' | 'purple' | 'pink';
}

export default function ModuleHeader({
  icon: Icon,
  title,
  subtitle,
  badge,
  badgeColor = 'blue'
}: ModuleHeaderProps) {
  const badgeColors = {
    blue: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    green: 'bg-green-500/20 text-green-300 border-green-500/30',
    purple: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    pink: 'bg-pink-500/20 text-pink-300 border-pink-500/30'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative mb-8"
    >
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/10 via-purple-600/10 to-pink-600/10 rounded-xl blur-xl" />

      <div className="relative module-header rounded-xl">
        {/* Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.1 }}
          className="module-icon"
        >
          <Icon className="w-6 h-6" />
        </motion.div>

        {/* Title and Subtitle */}
        <div className="flex-1">
          <div className="module-title">
            <span>{title}</span>
            {badge && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className={`text-xs font-semibold px-3 py-1 rounded-full border ${badgeColors[badgeColor]}`}
              >
                {badge}
              </motion.span>
            )}
          </div>
          {subtitle && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-sm text-slate-400 mt-2"
            >
              {subtitle}
            </motion.p>
          )}
        </div>
      </div>
    </motion.div>
  );
}
