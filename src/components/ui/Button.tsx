import { type ButtonHTMLAttributes, forwardRef } from 'react';
import { motion } from 'motion/react';
import { LucideIcon, Loader2 } from 'lucide-react';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success' | 'warning';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: LucideIcon;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
  fullWidth?: boolean;
}

const variants: Record<ButtonVariant, string> = {
  primary: `
    bg-gradient-to-r from-indigo-600 to-purple-600
    hover:from-indigo-500 hover:to-purple-500
    text-white shadow-lg hover:shadow-xl
    border border-indigo-500/50 hover:border-indigo-400
  `,
  secondary: `
    bg-slate-700/80 hover:bg-slate-600
    text-slate-100 border border-slate-600/50 hover:border-slate-500
    shadow hover:shadow-lg
  `,
  ghost: `
    bg-transparent hover:bg-slate-700/50
    text-slate-300 hover:text-white border border-transparent hover:border-slate-600/30
  `,
  danger: `
    bg-gradient-to-r from-red-600 to-rose-600
    hover:from-red-500 hover:to-rose-500
    text-white shadow-lg hover:shadow-xl
    border border-red-500/50 hover:border-red-400
  `,
  success: `
    bg-gradient-to-r from-emerald-600 to-teal-600
    hover:from-emerald-500 hover:to-teal-500
    text-white shadow-lg hover:shadow-xl
    border border-emerald-500/50 hover:border-emerald-400
  `,
  warning: `
    bg-gradient-to-r from-amber-500 to-orange-500
    hover:from-amber-400 hover:to-orange-400
    text-black shadow-lg hover:shadow-xl
    border border-amber-400/50
  `,
};

const sizes: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-xs gap-1.5 rounded-lg',
  md: 'px-5 py-2.5 text-sm gap-2 rounded-xl',
  lg: 'px-6 py-3 text-base gap-2.5 rounded-xl',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(({
  variant = 'primary',
  size = 'md',
  icon: Icon,
  iconPosition = 'left',
  loading = false,
  fullWidth = false,
  disabled,
  className = '',
  children,
  ...props
}, ref) => {
  const isDisabled = disabled || loading;

  return (
    <motion.button
      ref={ref}
      whileHover={isDisabled ? {} : { scale: 1.02, y: -1 }}
      whileTap={isDisabled ? {} : { scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
      className={`
        inline-flex items-center justify-center font-semibold
        transition-all duration-200 ease-out
        focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:ring-offset-2 focus:ring-offset-slate-900
        disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
        ${variants[variant]}
        ${sizes[size]}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
      disabled={isDisabled}
      {...props}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <>
          {Icon && iconPosition === 'left' && <Icon className="w-4 h-4 flex-shrink-0" />}
          {children && <span>{children}</span>}
          {Icon && iconPosition === 'right' && <Icon className="w-4 h-4 flex-shrink-0" />}
        </>
      )}
    </motion.button>
  );
});

Button.displayName = 'Button';
