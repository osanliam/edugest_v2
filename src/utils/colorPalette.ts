/**
 * Paleta de colores de alto contraste para EDUGEST
 * Diseño sofisticado con colores sólidos y legibles
 */

export const colorPalette = {
  // Primarios - Gradientes para headers y destacados
  primary: {
    from: 'from-cyan-400',
    to: 'to-blue-600',
    text: 'text-cyan-300',
    bg: 'bg-cyan-500/20',
    border: 'border-cyan-400/60',
    solid: 'bg-cyan-500',
  },

  // Secundarios - Para secciones alternadas
  secondary: {
    from: 'from-emerald-400',
    to: 'to-teal-600',
    text: 'text-emerald-300',
    bg: 'bg-emerald-500/20',
    border: 'border-emerald-400/60',
    solid: 'bg-emerald-500',
  },

  // Terciarios - Para acentos
  tertiary: {
    from: 'from-violet-400',
    to: 'to-purple-600',
    text: 'text-violet-300',
    bg: 'bg-violet-500/20',
    border: 'border-violet-400/60',
    solid: 'bg-violet-500',
  },

  // Éxito - Estados positivos
  success: {
    solid: 'bg-emerald-600',
    light: 'bg-emerald-500/30',
    text: 'text-emerald-300',
    border: 'border-emerald-500/70',
  },

  // Advertencia - Estados de atención
  warning: {
    solid: 'bg-amber-600',
    light: 'bg-amber-500/30',
    text: 'text-amber-300',
    border: 'border-amber-500/70',
  },

  // Error - Estados críticos
  error: {
    solid: 'bg-red-600',
    light: 'bg-red-500/30',
    text: 'text-red-300',
    border: 'border-red-500/70',
  },

  // Información - Estados neutrales
  info: {
    solid: 'bg-blue-600',
    light: 'bg-blue-500/30',
    text: 'text-blue-300',
    border: 'border-blue-500/70',
  },

  // Backgrounds
  bg: {
    primary: 'bg-slate-900',
    secondary: 'bg-slate-800',
    tertiary: 'bg-slate-700',
    input: 'bg-slate-800',
    hover: 'hover:bg-slate-700',
  },

  // Text
  text: {
    primary: 'text-white',
    secondary: 'text-slate-300',
    tertiary: 'text-slate-400',
    muted: 'text-slate-500',
  },

  // Borders
  border: {
    primary: 'border-slate-700',
    secondary: 'border-slate-600',
    light: 'border-slate-500/50',
  },
};

// Clases predefinidas para inputs y controles comunes
export const inputClasses = {
  standard: `w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2.5 text-white placeholder-slate-400
             focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50
             transition-colors text-sm font-medium`,
  sm: `w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-400
       focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50
       transition-colors text-sm`,
  lg: `w-full bg-slate-800 border border-slate-600 rounded-lg px-5 py-3 text-white placeholder-slate-400
       focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50
       transition-colors text-base font-medium`,
};

// Clases predefinidas para botones
export const buttonClasses = {
  primary: `bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500
            text-white font-bold px-4 py-2 rounded-lg transition-all shadow-lg hover:shadow-cyan-500/50`,
  secondary: `bg-slate-700 hover:bg-slate-600 text-white font-bold px-4 py-2 rounded-lg transition-all
              border border-slate-600`,
  success: `bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2 rounded-lg transition-all
            shadow-lg hover:shadow-emerald-500/50`,
  danger: `bg-red-600 hover:bg-red-500 text-white font-bold px-4 py-2 rounded-lg transition-all
           shadow-lg hover:shadow-red-500/50`,
};

// Cards de estado (Calificativos)
export const stateCards = {
  A: {
    bg: 'bg-emerald-900/50',
    border: 'border-emerald-500/70',
    text: 'text-emerald-300',
    badge: 'bg-emerald-600',
  },
  B: {
    bg: 'bg-amber-900/50',
    border: 'border-amber-500/70',
    text: 'text-amber-300',
    badge: 'bg-amber-600',
  },
  C: {
    bg: 'bg-red-900/50',
    border: 'border-red-500/70',
    text: 'text-red-300',
    badge: 'bg-red-600',
  },
  AD: {
    bg: 'bg-violet-900/50',
    border: 'border-violet-500/70',
    text: 'text-violet-300',
    badge: 'bg-violet-600',
  },
};
