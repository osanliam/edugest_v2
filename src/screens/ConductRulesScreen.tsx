import { motion } from 'motion/react';
import { useState } from 'react';
import { BookOpen, CheckCircle, AlertTriangle, Flag, Heart, Users, Zap, Shield } from 'lucide-react';
import { User as UserType } from '../types';

interface ConductRulesScreenProps {
  user: UserType;
}

interface Rule {
  id: string;
  category: string;
  title: string;
  description: string;
  importance: 'high' | 'medium' | 'low';
  icon: React.ReactNode;
}

const conductRules: Rule[] = [
  {
    id: '1',
    category: 'Disciplina',
    title: 'Puntualidad',
    description: 'Llegar a tiempo a todas las clases. La tolerancia máxima es de 5 minutos.',
    importance: 'high',
    icon: <Flag className="w-5 h-5" />,
  },
  {
    id: '2',
    category: 'Respeto',
    title: 'Respeto a Docentes',
    description: 'Mostrar respeto y consideración hacia todos los docentes y autoridades de la institución.',
    importance: 'high',
    icon: <Heart className="w-5 h-5" />,
  },
  {
    id: '3',
    category: 'Comportamiento',
    title: 'Comportamiento en Aula',
    description: 'Mantener un comportamiento adecuado durante las clases, evitar interrupciones innecesarias.',
    importance: 'high',
    icon: <Shield className="w-5 h-5" />,
  },
  {
    id: '4',
    category: 'Uniforme',
    title: 'Uniforme Escolar',
    description: 'Usar el uniforme completo y adecuado según las normas de la institución.',
    importance: 'medium',
    icon: <Zap className="w-5 h-5" />,
  },
  {
    id: '5',
    category: 'Asistencia',
    title: 'Asistencia Regular',
    description: 'Mantener una asistencia mínima del 85% en todas las materias.',
    importance: 'high',
    icon: <CheckCircle className="w-5 h-5" />,
  },
  {
    id: '6',
    category: 'Relaciones',
    title: 'Convivencia Pacífica',
    description: 'Fomentar un ambiente de paz y respeto entre compañeros. Prohibido cualquier forma de violencia.',
    importance: 'high',
    icon: <Users className="w-5 h-5" />,
  },
  {
    id: '7',
    category: 'Académico',
    title: 'Tareas y Trabajos',
    description: 'Entregar todas las tareas y trabajos en las fechas establecidas.',
    importance: 'medium',
    icon: <BookOpen className="w-5 h-5" />,
  },
  {
    id: '8',
    category: 'Prohibiciones',
    title: 'Sustancias Prohibidas',
    description: 'Está prohibido el uso de drogas, alcohol y cualquier sustancia nociva dentro de la institución.',
    importance: 'high',
    icon: <AlertTriangle className="w-5 h-5" />,
  },
  {
    id: '9',
    category: 'Tecnología',
    title: 'Uso de Dispositivos',
    description: 'El uso de celulares y otros dispositivos está permitido solo en horarios de descanso.',
    importance: 'medium',
    icon: <Zap className="w-5 h-5" />,
  },
  {
    id: '10',
    category: 'Seguridad',
    title: 'Responsabilidad Personal',
    description: 'La institución no se responsabiliza por pérdida de objetos personales.',
    importance: 'low',
    icon: <Shield className="w-5 h-5" />,
  },
];

const getImportanceColor = (importance: 'high' | 'medium' | 'low') => {
  switch (importance) {
    case 'high':
      return 'neon-magenta';
    case 'medium':
      return 'neon-cyan';
    case 'low':
      return 'neon-lime';
  }
};

const getImportanceLabel = (importance: 'high' | 'medium' | 'low') => {
  switch (importance) {
    case 'high':
      return 'Muy Importante';
    case 'medium':
      return 'Importante';
    case 'low':
      return 'Informativo';
  }
};

export default function ConductRulesScreen({ user }: ConductRulesScreenProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [expandedRule, setExpandedRule] = useState<string | null>(null);

  const categories = [...new Set(conductRules.map(r => r.category))];
  const filteredRules = selectedCategory === 'all'
    ? conductRules
    : conductRules.filter(r => r.category === selectedCategory);

  const importantRules = conductRules.filter(r => r.importance === 'high');

  return (
    <div className="min-h-screen p-6 space-y-8 pb-24">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-neon-magenta/20 rounded-lg neon-border-magenta">
            <BookOpen className="w-8 h-8 text-neon-magenta" />
          </div>
          <div>
            <h1 className="text-4xl font-bold tracking-tighter uppercase">
              Normas de <span className="text-neon-cyan neon-text-cyan">Convivencia</span>
            </h1>
            <p className="text-xs text-white/75 font-mono tracking-widest">REGLAS Y REGULACIONES</p>
          </div>
        </div>
      </motion.div>

      {/* Important Rules Alert */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card p-6 neon-border-magenta bg-neon-magenta/5"
      >
        <div className="flex items-start gap-3 mb-4">
          <AlertTriangle className="w-6 h-6 text-neon-magenta flex-shrink-0 mt-1" />
          <div>
            <h3 className="text-white font-bold uppercase tracking-wider mb-3">Reglas Fundamentales</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {importantRules.slice(0, 4).map((rule) => (
                <div key={rule.id} className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-neon-lime flex-shrink-0 mt-1" />
                  <div>
                    <p className="text-white font-semibold text-sm">{rule.title}</p>
                    <p className="text-white/85 text-xs mt-1">{rule.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Category Filter */}
      <div>
        <p className="text-white/85 text-sm uppercase tracking-wider mb-3 font-semibold">Filtrar por Categoría</p>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-2 rounded-lg font-semibold text-sm uppercase tracking-wider transition-all ${
              selectedCategory === 'all'
                ? 'bg-neon-cyan text-black'
                : 'bg-white/10 border border-white/20 text-white hover:bg-white/20'
            }`}
          >
            Todas
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-lg font-semibold text-sm uppercase tracking-wider transition-all ${
                selectedCategory === cat
                  ? 'bg-neon-magenta text-black'
                  : 'bg-white/10 border border-white/20 text-white hover:bg-white/20'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Rules List */}
      <div className="space-y-4">
        {filteredRules.map((rule, i) => (
          <motion.div
            key={rule.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className={`glass-card neon-border-${getImportanceColor(rule.importance)} border-2 p-4 cursor-pointer hover:bg-white/5 transition-all`}
            onClick={() => setExpandedRule(expandedRule === rule.id ? null : rule.id)}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4 flex-1">
                <div className={`p-2 bg-${getImportanceColor(rule.importance)}/20 rounded-lg flex-shrink-0`}>
                  {rule.icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-white font-bold uppercase tracking-wider">{rule.title}</h3>
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full bg-${getImportanceColor(rule.importance)}/20 text-${getImportanceColor(rule.importance)}`}>
                      {getImportanceLabel(rule.importance)}
                    </span>
                  </div>
                  <p className="text-white/85 text-sm mb-2">{rule.category}</p>
                  {expandedRule === rule.id && (
                    <motion.p
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="text-white/80 text-sm mt-3 pt-3 border-t border-white/10"
                    >
                      {rule.description}
                    </motion.p>
                  )}
                </div>
              </div>
              <motion.div
                animate={{ rotate: expandedRule === rule.id ? 180 : 0 }}
                className="text-white/85 flex-shrink-0"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              </motion.div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Summary Statistics */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        <div className="glass-card p-4 neon-border-magenta">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-5 h-5 text-neon-magenta" />
            <p className="text-white/85 text-sm uppercase">Muy Importantes</p>
          </div>
          <p className="text-3xl font-bold text-white">{conductRules.filter(r => r.importance === 'high').length}</p>
        </div>
        <div className="glass-card p-4 neon-border-cyan">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-5 h-5 text-neon-cyan" />
            <p className="text-white/85 text-sm uppercase">Importantes</p>
          </div>
          <p className="text-3xl font-bold text-white">{conductRules.filter(r => r.importance === 'medium').length}</p>
        </div>
        <div className="glass-card p-4 neon-border-lime">
          <div className="flex items-center gap-2 mb-2">
            <BookOpen className="w-5 h-5 text-neon-lime" />
            <p className="text-white/85 text-sm uppercase">Informativos</p>
          </div>
          <p className="text-3xl font-bold text-white">{conductRules.filter(r => r.importance === 'low').length}</p>
        </div>
      </motion.div>

      {/* Footer Note */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="glass-card p-4 neon-border-cyan border-l-4"
      >
        <p className="text-white/90 text-sm">
          ℹ️ Estas normas de convivencia están diseñadas para garantizar un ambiente seguro, respetuoso y conducente para el aprendizaje de todos los estudiantes.
          El incumplimiento de estas normas puede resultar en sanciones disciplinarias.
        </p>
      </motion.div>
    </div>
  );
}
