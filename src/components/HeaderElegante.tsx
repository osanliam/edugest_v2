import { LucideIcon } from 'lucide-react';
import { motion } from 'motion/react';
import { ReactNode } from 'react';

interface HeaderEleganteProps {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  children?: ReactNode;
}

export default function HeaderElegante({ icon: Icon, title, subtitle, children }: HeaderEleganteProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-8"
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {/* Icono con fondo elegante */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1 }}
            className="p-3 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-500 shadow-lg"
          >
            <Icon className="w-8 h-8 text-white" />
          </motion.div>

          {/* Título y subtítulo */}
          <div>
            <motion.h1
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400"
            >
              {title.toUpperCase()}
            </motion.h1>
            {subtitle && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-sm text-slate-400 mt-1"
              >
                {subtitle}
              </motion.p>
            )}
          </div>
        </div>
        {children && (
          <div className="flex gap-2 flex-wrap items-center justify-end">
            {children}
          </div>
        )}
      </div>
    </motion.div>
  );
}
