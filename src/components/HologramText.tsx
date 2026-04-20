import React from 'react';

interface HologramTextProps {
  children: string;
  className?: string;
  variant?: 'primary' | 'secondary' | 'accent';
  animated?: boolean;
}

export default function HologramText({
  children,
  className = '',
  variant = 'primary',
  animated = true,
}: HologramTextProps) {
  const variants = {
    primary: 'text-transparent bg-clip-text bg-gradient-hologram',
    secondary: 'text-transparent bg-clip-text bg-gradient-hologram-reverse',
    accent: 'text-neon-cyan drop-shadow-lg',
  };

  return (
    <span
      className={`
        ${variants[variant]}
        font-bold tracking-wider
        ${animated ? 'animate-hologram bg-size-200' : ''}
        ${className}
      `}
      style={
        animated
          ? {
              backgroundSize: '200% 200%',
            }
          : {}
      }
    >
      {children}
    </span>
  );
}
