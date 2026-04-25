import { motion } from 'motion/react';
import { useState } from 'react';
import { BookOpen, Calendar, FileText, Users, Video, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import HeaderElegante from '../components/HeaderElegante';
import ElegantCard from '../components/ElegantCard';

interface VirtualClass {
  id: string;
  name: string;
  teacher: string;
  schedule: string;
  students: number;
  status: 'active' | 'upcoming' | 'ended';
  materials: number;
  tasks: number;
}

interface ClassMaterial {
  id: string;
  title: string;
  type: 'video' | 'document' | 'link' | 'assignment';
  date: string;
  size?: string;
}

export default function VirtualClassroomScreenModernV2() {
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [view, setView] = useState<'clases' | 'tareas' | 'recursos'>('clases');

  const classes: VirtualClass[] = [
    {
      id: '1',
      name: 'Comunicación I',
      teacher: 'Lic. Juan Pérez',
      schedule: 'Lunes 10:00 - 11:30',
      students: 32,
      status: 'active',
      materials: 15,
      tasks: 8
    },
    {
      id: '2',
      name: 'Matemática I',
      teacher: 'Lic. María González',
      schedule: 'Miércoles 14:00 - 15:30',
      students: 28,
      status: 'upcoming',
      materials: 12,
      tasks: 6
    },
    {
      id: '3',
      name: 'Historia del Perú',
      teacher: 'Dr. Carlos Rodríguez',
      schedule: 'Viernes 09:00 - 10:30',
      students: 31,
      status: 'ended',
      materials: 18,
      tasks: 5
    },
    {
      id: '4',
      name: 'Inglés I',
      teacher: 'Lic. Patricia López',
      schedule: 'Martes 15:00 - 16:30',
      students: 29,
      status: 'active',
      materials: 10,
      tasks: 7
    }
  ];

  const materials: ClassMaterial[] = [
    {
      id: '1',
      title: 'Introducción a la Oratoria',
      type: 'video',
      date: '2024-04-20',
      size: '125 MB'
    },
    {
      id: '2',
      title: 'Guía de Lectura - Capítulo 3',
      type: 'document',
      date: '2024-04-19',
      size: '2.5 MB'
    },
    {
      id: '3',
      title: 'Ejercicio Práctico de Redacción',
      type: 'assignment',
      date: '2024-04-18'
    },
    {
      id: '4',
      title: 'Artículo Complementario',
      type: 'link',
      date: '2024-04-17'
    }
  ];

  const statusConfig = {
    active: { bg: 'bg-green-500/20', border: 'border-green-500/30', text: 'text-green-300', label: 'En Vivo' },
    upcoming: { bg: 'bg-blue-500/20', border: 'border-blue-500/30', text: 'text-blue-300', label: 'Próximo' },
    ended: { bg: 'bg-slate-500/20', border: 'border-slate-500/30', text: 'text-slate-300', label: 'Finalizado' }
  };

  const getMaterialIcon = (type: ClassMaterial['type']) => {
    switch (type) {
      case 'video':
        return <Video className="w-5 h-5" />;
      case 'document':
        return <FileText className="w-5 h-5" />;
      case 'assignment':
        return <CheckCircle2 className="w-5 h-5" />;
      case 'link':
        return <AlertCircle className="w-5 h-5" />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-900/50 overflow-hidden">
      {/* Background decorativo */}
      <div className="fixed inset-0 -z-50">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/5 via-transparent to-purple-600/5" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <HeaderElegante
          icon={BookOpen}
          title="EDUGEST AULA VIRTUAL"
          subtitle="Acceso a tus clases, tareas y recursos en línea"
        />

        {/* Navigation tabs */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex gap-3 mb-8 border-b border-slate-700/30 pb-4"
        >
          {[
            { id: 'clases', label: 'Mis Clases', icon: BookOpen },
            { id: 'tareas', label: 'Tareas', icon: CheckCircle2 },
            { id: 'recursos', label: 'Recursos', icon: FileText }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setView(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                view === tab.id
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white'
                  : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </motion.div>

        {/* Content based on view */}
        {view === 'clases' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {classes.map((cls, i) => {
                const isSelected = selectedClass === cls.id;
                const config = statusConfig[cls.status];

                return (
                  <ElegantCard
                    key={cls.id}
                    index={i}
                    onClick={() => setSelectedClass(isSelected ? null : cls.id)}
                    className={`cursor-pointer ${isSelected ? 'ring-2 ring-indigo-500' : ''}`}
                  >
                    <div className="space-y-4">
                      {/* Header */}
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-bold text-slate-100 text-lg">{cls.name}</h4>
                          <p className="text-sm text-slate-400">{cls.teacher}</p>
                        </div>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold border ${config.bg} ${config.border} ${config.text}`}
                        >
                          {config.label}
                        </span>
                      </div>

                      {/* Details */}
                      <div className="flex flex-wrap gap-3 text-sm text-slate-400">
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {cls.schedule}
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {cls.students} estudiantes
                        </div>
                      </div>

                      {/* Stats */}
                      {isSelected && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-700/30"
                        >
                          <div className="bg-indigo-500/10 rounded-lg p-3 text-center">
                            <p className="text-2xl font-bold text-indigo-300">{cls.materials}</p>
                            <p className="text-xs text-slate-400">Materiales</p>
                          </div>
                          <div className="bg-purple-500/10 rounded-lg p-3 text-center">
                            <p className="text-2xl font-bold text-purple-300">{cls.tasks}</p>
                            <p className="text-xs text-slate-400">Tareas</p>
                          </div>
                        </motion.div>
                      )}
                    </div>
                  </ElegantCard>
                );
              })}
            </div>
          </motion.div>
        )}

        {view === 'tareas' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            {[
              { title: 'Ensayo sobre educación', due: '2024-04-25', status: 'pending' },
              { title: 'Problema de matemáticas (Conjunto A)', due: '2024-04-23', status: 'pending' },
              { title: 'Lectura y análisis - Capítulo 5', due: '2024-04-22', status: 'completed' },
              { title: 'Diálogo en inglés', due: '2024-04-20', status: 'completed' }
            ].map((task, i) => (
              <ElegantCard key={i} index={i} variant="minimal">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h4 className="font-semibold text-slate-100">{task.title}</h4>
                    <p className="text-sm text-slate-400 mt-1">Vencimiento: {task.due}</p>
                  </div>
                  {task.status === 'completed' ? (
                    <span className="text-xs font-semibold text-green-400 bg-green-500/20 px-3 py-1 rounded-full">
                      Entregado
                    </span>
                  ) : (
                    <span className="text-xs font-semibold text-yellow-400 bg-yellow-500/20 px-3 py-1 rounded-full">
                      Pendiente
                    </span>
                  )}
                </div>
              </ElegantCard>
            ))}
          </motion.div>
        )}

        {view === 'recursos' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            {materials.map((material, i) => (
              <ElegantCard key={material.id} index={i} variant="minimal">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="p-3 bg-indigo-500/10 rounded-lg text-indigo-400">
                      {getMaterialIcon(material.type)}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-slate-100">{material.title}</h4>
                      <div className="flex items-center gap-3 mt-2 text-sm text-slate-400">
                        <span>{material.date}</span>
                        {material.size && <span>•</span>}
                        {material.size && <span>{material.size}</span>}
                      </div>
                    </div>
                  </div>
                  <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors">
                    {material.type === 'link' ? 'Abrir' : 'Descargar'}
                  </button>
                </div>
              </ElegantCard>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}
