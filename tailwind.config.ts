import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Colores neon base
        'neon-cyan': '#06b6d4',
        'neon-magenta': '#d946ef',
        'neon-lime': '#84cc16',
        'neon-blue': '#3b82f6',
        'neon-pink': '#ec4899',
        'neon-purple': '#a855f7',
        // Colores holográficos
        'holo-cyan': 'hsl(190, 100%, 52%)',
        'holo-magenta': 'hsl(280, 100%, 52%)',
        'holo-lime': 'hsl(78, 100%, 52%)',
        // Colores oscuros mejorados
        'dark-bg': '#0a0e27',
        'dark-bg-secondary': '#1a1f3a',
        'dark-surface': '#151b2f',
      },
      backgroundImage: {
        // Gradientes holográficos
        'gradient-hologram': 'linear-gradient(135deg, #06b6d4 0%, #d946ef 50%, #84cc16 100%)',
        'gradient-hologram-reverse': 'linear-gradient(135deg, #84cc16 0%, #d946ef 50%, #06b6d4 100%)',
        'gradient-cyber': 'linear-gradient(90deg, #0a0e27 0%, #1a1f3a 50%, #0a0e27 100%)',
        'gradient-neon-glow': 'radial-gradient(circle, rgba(6,182,212,0.3) 0%, transparent 70%)',
        'gradient-magenta-glow': 'radial-gradient(circle, rgba(217,70,239,0.3) 0%, transparent 70%)',
        'gradient-glass': 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
      },
      backdropBlur: {
        xs: '2px',
        sm: '4px',
        md: '12px',
        lg: '16px',
        xl: '24px',
        '2xl': '40px',
      },
      boxShadow: {
        // Sombras neon/glow
        'glow-cyan': '0 0 20px rgba(6, 182, 212, 0.5), 0 0 40px rgba(6, 182, 212, 0.25)',
        'glow-magenta': '0 0 20px rgba(217, 70, 239, 0.5), 0 0 40px rgba(217, 70, 239, 0.25)',
        'glow-lime': '0 0 20px rgba(132, 204, 22, 0.5), 0 0 40px rgba(132, 204, 22, 0.25)',
        'glow-blue': '0 0 20px rgba(59, 130, 246, 0.5), 0 0 40px rgba(59, 130, 246, 0.25)',
        'glow-lg': '0 0 30px rgba(6, 182, 212, 0.4), 0 0 60px rgba(217, 70, 239, 0.2)',
        'inner-glow': 'inset 0 0 20px rgba(6, 182, 212, 0.2)',
        'glass': '0 8px 32px rgba(6, 182, 212, 0.1)',
        'glass-md': '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
        'elevated': '0 20px 60px rgba(0, 0, 0, 0.5), 0 0 30px rgba(6, 182, 212, 0.1)',
      },
      keyframes: {
        // Animaciones futuristas
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        'glow-pulse': {
          '0%, 100%': {
            boxShadow: '0 0 20px rgba(6, 182, 212, 0.5), 0 0 40px rgba(6, 182, 212, 0.25)',
            opacity: '1',
          },
          '50%': {
            boxShadow: '0 0 40px rgba(6, 182, 212, 0.8), 0 0 80px rgba(6, 182, 212, 0.4)',
            opacity: '0.8',
          },
        },
        'hologram': {
          '0%, 100%': {
            backgroundPosition: '0% 50%',
            opacity: '1',
          },
          '50%': {
            backgroundPosition: '100% 50%',
            opacity: '0.9',
          },
        },
        'neon-flicker': {
          '0%, 19%, 21%, 23%, 25%, 54%, 56%, 100%': {
            textShadow: '0 0 10px rgba(6, 182, 212, 0.8), 0 0 20px rgba(6, 182, 212, 0.4)',
          },
          '20%, 24%, 55%': {
            textShadow: 'none',
          },
        },
        'scan-line': {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' },
        },
        'rgb-shift': {
          '0%': {
            textShadow: '0 0 10px #06b6d4, 2px 2px 0px #d946ef, 4px 4px 0px #84cc16',
          },
          '50%': {
            textShadow: '0 0 10px #d946ef, 2px 2px 0px #84cc16, 4px 4px 0px #06b6d4',
          },
          '100%': {
            textShadow: '0 0 10px #84cc16, 2px 2px 0px #06b6d4, 4px 4px 0px #d946ef',
          },
        },
        'data-flow': {
          '0%': { backgroundPosition: '0% 0%' },
          '100%': { backgroundPosition: '100% 100%' },
        },
        'pulse-glow': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'glow-pulse': 'glow-pulse 3s ease-in-out infinite',
        'hologram': 'hologram 8s ease infinite',
        'neon-flicker': 'neon-flicker 0.15s infinite',
        'scan-line': 'scan-line 8s linear infinite',
        'rgb-shift': 'rgb-shift 3s ease-in-out infinite',
        'data-flow': 'data-flow 20s linear infinite',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
      },
      borderImage: {
        gradient: 'linear-gradient(90deg, #06b6d4, #d946ef, #84cc16)',
      },
      opacity: {
        '8': '0.08',
        '12': '0.12',
        '15': '0.15',
      },
      transitionTimingFunction: {
        'bounce-in': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],
        'base': ['1rem', { lineHeight: '1.5rem' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
        'neon-xs': ['0.75rem', { fontWeight: '900', letterSpacing: '0.1em', lineHeight: '1rem' }],
        'neon-sm': ['0.875rem', { fontWeight: '900', letterSpacing: '0.08em', lineHeight: '1.25rem' }],
      },
    },
  },
  plugins: [],
};

export default config;
