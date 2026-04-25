import { motion } from 'motion/react';
import { useState } from 'react';
import { Shield, Users, Heart, Brain, AlertTriangle, CheckCircle2, Zap } from 'lucide-react';
import HeaderElegante from '../components/HeaderElegante';
import ElegantCard from '../components/ElegantCard';

interface Norma {
  id: string;
  title: string;
  description: string;
  category: string;
  importance: 'high' | 'medium' | 'low';
}

interface Infraction {
  id: string;
  level: 'leve' | 'grave' | 'muy-grave';
  examples: string[];
  consequences: string[];
}

export default function NormasConvivenciaModerno() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [expandedNorm, setExpandedNorm] = useState<string | null>(null);

  const categories = [
    { id: 'all', label: 'Todas', icon: Shield },
    { id: 'respect', label: 'Respeto', icon: Heart },
    { id: 'responsibility', label: 'Responsabilidad', icon: Brain },
    { id: 'integrity', label: 'Integridad', icon: CheckCircle2 }
  ];

  const normas: Norma[] = [
    {
      id: '1',
      title: 'Respeto a la Autoridad',
      description: 'Debemos respetar a maestros, directivos y personal administrativo, acatando sus instrucciones.',
      category: 'respect',
      importance: 'high'
    },
    {
      id: '2',
      title: 'Puntualidad en Clases',
      description: 'Los estudiantes deben llegar a tiempo a todas las clases. Retrasos frecuentes afectan el aprendizaje.',
      category: 'responsibility',
      importance: 'high'
    },
    {
      id: '3',
      title: 'Presentación Personal',
      description: 'Mantener una presentación limpia y ordenada, de acuerdo con el uniforme institucional establecido.',
      category: 'integrity',
      importance: 'medium'
    },
    {
      id: '4',
      title: 'Respeto entre Compañeros',
      description: 'No se permite el bullying, discriminación o burla hacia compañeros de estudio.',
      category: 'respect',
      importance: 'high'
    },
    {
      id: '5',
      title: 'Cuidado del Patrimonio',
      description: 'Responsabilidad por los bienes de la institución. Quien daña debe reparar o reponer.',
      category: 'responsibility',
      importance: 'medium'
    },
    {
      id: '6',
      title: 'Honestidad Académica',
      description: 'Prohibido copiar en exámenes o trabajos. Las calificaciones deben reflejar el trabajo propio.',
      category: 'integrity',
      importance: 'high'
    }
  ];

  const infractions: Infraction[] = [
    {
      id: '1',
      level: 'leve',
      examples: [
        'Falta menor de puntualidad',
        'Olvido de útiles escolares',
        'Uniforme incompleto ocasional',
        'Conversación fuera de lugar'
      ],
      consequences: [
        'Amonestación oral',
        'Anotación en el cuaderno de clase',
        'Comunicación a los padres'
      ]
    },
    {
      id: '2',
      level: 'grave',
      examples: [
        'Reincidencia de faltas leves',
        'Agresión verbal a compañeros',
        'Irrespeto a la autoridad',
        'Copia en evaluaciones',
        'Destrucción menor de bienes'
      ],
      consequences: [
        'Amonestación escrita',
        'Citación de padres/apoderados',
        'Suspensión de 1-3 días',
        'Trabajo comunitario',
        'Restitución de bienes dañados'
      ]
    },
    {
      id: '3',
      level: 'muy-grave',
      examples: [
        'Agresión física a compañeros o docentes',
        'Porte de armas u objetos peligrosos',
        'Consumo o tráfico de drogas',
        'Acoso sexual o abuso',
        'Delitos penales',
        'Reincidencia de faltas graves'
      ],
      consequences: [
        'Expulsión definitiva',
        'Reporte a autoridades policiales',
        'Apoyo psicológico obligatorio',
        'Revisión de expediente académico'
      ]
    }
  ];

  const filteredNormas = selectedCategory === 'all'
    ? normas
    : normas.filter(n => n.category === selectedCategory);

  const getImportanceColor = (importance: string) => {
    switch (importance) {
      case 'high':
        return { bg: 'bg-red-500/20', text: 'text-red-300', label: 'Fundamental' };
      case 'medium':
        return { bg: 'bg-yellow-500/20', text: 'text-yellow-300', label: 'Importante' };
      case 'low':
        return { bg: 'bg-green-500/20', text: 'text-green-300', label: 'Recomendado' };
      default:
        return { bg: 'bg-slate-500/20', text: 'text-slate-300', label: 'Información' };
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'leve':
        return { bg: 'bg-blue-500/20', border: 'border-blue-500/30', text: 'text-blue-300' };
      case 'grave':
        return { bg: 'bg-yellow-500/20', border: 'border-yellow-500/30', text: 'text-yellow-300' };
      case 'muy-grave':
        return { bg: 'bg-red-500/20', border: 'border-red-500/30', text: 'text-red-300' };
      default:
        return { bg: 'bg-slate-500/20', border: 'border-slate-500/30', text: 'text-slate-300' };
    }
  };

  return (
    <div className="min-h-screen bg-slate-900/50 overflow-hidden">
      {/* Background decorativo */}
      <div className="fixed inset-0 -z-50">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/5 via-transparent to-purple-600/5" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <HeaderElegante
          icon={Shield}
          title="EDUGEST NORMAS DE CONVIVENCIA"
          subtitle="Principios y valores que rigen nuestra comunidad educativa"
        />

        {/* Principios fundamentales */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8"
        >
          {[
            { icon: Heart, title: 'Respeto', desc: 'Hacia nosotros mismos y los demás' },
            { icon: Brain, title: 'Responsabilidad', desc: 'En nuestros actos y decisiones' },
            { icon: CheckCircle2, title: 'Integridad', desc: 'Actuando con honestidad siempre' }
          ].map((principle, i) => {
            const PrincipleIcon = principle.icon;
            return (
              <ElegantCard key={i} index={i}>
                <div className="text-center space-y-3">
                  <div className="flex justify-center">
                    <div className="p-4 rounded-lg bg-indigo-500/20 text-indigo-400">
                      <PrincipleIcon className="w-8 h-8" />
                    </div>
                  </div>
                  <h3 className="text-lg font-bold text-slate-100">{principle.title}</h3>
                  <p className="text-sm text-slate-400">{principle.desc}</p>
                </div>
              </ElegantCard>
            );
          })}
        </motion.div>

        {/* Category filter */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 p-6 rounded-xl glass-card"
        >
          <p className="text-sm text-slate-400 mb-4 font-semibold">Filtrar por Categoría</p>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {categories.map(cat => {
              const CatIcon = cat.icon;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all whitespace-nowrap font-medium ${
                    selectedCategory === cat.id
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white'
                      : 'bg-slate-700/50 text-slate-300 hover:bg-slate-600/50'
                  }`}
                >
                  <CatIcon className="w-4 h-4" />
                  {cat.label}
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* Normas */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-8 space-y-4"
        >
          <h3 className="text-xl font-bold text-slate-100">Normas por Cumplir</h3>
          {filteredNormas.map((norma, i) => {
            const impColor = getImportanceColor(norma.importance);
            const isExpanded = expandedNorm === norma.id;

            return (
              <ElegantCard
                key={norma.id}
                index={i}
                onClick={() => setExpandedNorm(isExpanded ? null : norma.id)}
                className="cursor-pointer"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-lg font-bold text-slate-100">{norma.title}</h4>
                      <p className="text-sm text-slate-400 mt-1">{norma.description}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${impColor.bg} ${impColor.text}`}>
                      {impColor.label}
                    </span>
                  </div>
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="pt-3 border-t border-slate-700/30"
                    >
                      <p className="text-sm text-slate-300">
                        El cumplimiento de esta norma fortalece nuestra comunidad y asegura un ambiente de convivencia pacífica.
                      </p>
                    </motion.div>
                  )}
                </div>
              </ElegantCard>
            );
          })}
        </motion.div>

        {/* Escalas de infracción */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <h3 className="text-xl font-bold text-slate-100 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-yellow-400" />
            Escala de Infracciones y Consecuencias
          </h3>

          <div className="space-y-6">
            {infractions.map((infraction, i) => {
              const levelColor = getLevelColor(infraction.level);
              const levelLabel =
                infraction.level === 'leve'
                  ? 'Faltas Leves'
                  : infraction.level === 'grave'
                  ? 'Faltas Graves'
                  : 'Faltas Muy Graves';

              return (
                <ElegantCard key={infraction.id} index={i} variant="elevated">
                  <div className="space-y-4">
                    <h4 className={`text-lg font-bold flex items-center gap-2 ${levelColor.text}`}>
                      <Zap className="w-5 h-5" />
                      {levelLabel}
                    </h4>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div>
                        <h5 className="font-semibold text-slate-100 mb-3">Ejemplos de conductas</h5>
                        <ul className="space-y-2">
                          {infraction.examples.map((example, j) => (
                            <li key={j} className="text-sm text-slate-300 flex items-start gap-2">
                              <span className={`mt-1 w-2 h-2 rounded-full ${levelColor.text} flex-shrink-0`} />
                              {example}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <h5 className="font-semibold text-slate-100 mb-3">Consecuencias</h5>
                        <ul className="space-y-2">
                          {infraction.consequences.map((consequence, j) => (
                            <li key={j} className="text-sm text-slate-300 flex items-start gap-2">
                              <CheckCircle2 className={`w-4 h-4 mt-0.5 flex-shrink-0 ${levelColor.text}`} />
                              {consequence}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </ElegantCard>
              );
            })}
          </div>
        </motion.div>

        {/* Derechos del estudiante */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-8 p-6 rounded-xl glass-card-elevated border border-green-500/20"
        >
          <h3 className="text-lg font-bold text-slate-100 mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-green-400" />
            Derechos del Estudiante
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-300">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
              <span>Derecho a la educación de calidad</span>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
              <span>Derecho al respeto y dignidad</span>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
              <span>Derecho a ser escuchado</span>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
              <span>Derecho a la defensa ante acciones disciplinarias</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
