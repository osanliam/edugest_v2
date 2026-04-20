/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { cn } from '@/src/lib/utils';
import { motion, HTMLMotionProps } from 'motion/react';

interface GlassCardProps extends HTMLMotionProps<'div'> {
  title?: string;
  icon?: React.ReactNode;
  headerAction?: React.ReactNode;
  children: React.ReactNode;
}

export function GlassCard({ title, icon, headerAction, children, className, ...props }: GlassCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('glass-panel flex flex-col', className)}
      {...props}
    >
      {(title || icon || headerAction) && (
        <div className="flex items-center justify-between p-4 border-b border-gray-200/50">
          <div className="flex items-center gap-2">
            {icon && <div className="text-cyber-cyan">{icon}</div>}
            {title && <h3 className="font-mono text-sm font-semibold tracking-wider uppercase text-gray-700">{title}</h3>}
          </div>
          {headerAction}
        </div>
      )}
      <div className="flex-1 p-4">
        {children}
      </div>
    </motion.div>
  );
}
