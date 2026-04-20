/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { cn } from '@/src/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  change?: string;
  variant?: 'blue' | 'pink' | 'green' | 'purple';
}

const variantConfig = {
  blue: {
    gradient: 'bg-gradient-to-br from-blue-200/60 to-blue-100/40',
    border: 'border-blue-300/50',
    iconBg: 'bg-blue-100/80',
    iconColor: 'text-blue-500',
    changeColor: 'text-blue-600',
    changeBg: 'bg-blue-100/80',
  },
  pink: {
    gradient: 'bg-gradient-to-br from-pink-200/60 to-pink-100/40',
    border: 'border-pink-300/50',
    iconBg: 'bg-pink-100/80',
    iconColor: 'text-pink-500',
    changeColor: 'text-pink-600',
    changeBg: 'bg-pink-100/80',
  },
  green: {
    gradient: 'bg-gradient-to-br from-green-200/60 to-green-100/40',
    border: 'border-green-300/50',
    iconBg: 'bg-green-100/80',
    iconColor: 'text-green-600',
    changeColor: 'text-green-700',
    changeBg: 'bg-green-100/80',
  },
  purple: {
    gradient: 'bg-gradient-to-br from-purple-200/60 to-purple-100/40',
    border: 'border-purple-300/50',
    iconBg: 'bg-purple-100/80',
    iconColor: 'text-purple-500',
    changeColor: 'text-purple-600',
    changeBg: 'bg-purple-100/80',
  },
};

export function StatCard({ title, value, icon, change, variant = 'blue' }: StatCardProps) {
  const config = variantConfig[variant];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={cn(
        'rounded-2xl p-6 border-2 shadow-sm',
        config.gradient,
        config.border
      )}
    >
      {/* Icon and change badge row */}
      <div className="flex items-center justify-between mb-4">
        {icon ? (
          <div className={cn('p-2 rounded-xl', config.iconBg, config.iconColor)}>
            {icon}
          </div>
        ) : (
          <div className={cn('w-9 h-9 rounded-xl', config.iconBg)} />
        )}
        {change && (
          <span className={cn(
            'text-xs font-semibold px-2.5 py-1 rounded-full',
            config.changeBg,
            config.changeColor
          )}>
            {change}
          </span>
        )}
      </div>

      {/* Label */}
      <p className="text-gray-500 text-xs uppercase tracking-widest font-semibold mb-1">
        {title}
      </p>

      {/* Value */}
      <p className="text-3xl font-bold text-gray-800 leading-tight">
        {value}
      </p>
    </motion.div>
  );
}
