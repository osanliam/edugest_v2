import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Plus, Search, Filter, Download, TrendingUp, Award, Clock } from 'lucide-react';
import { getEstudiantes, getMaestros, guardarNota } from '../services/dataService';

interface Estudiante {
  id: string;
  nombre: string;
  email: string;
  grado: string;
}

interface Calificativo {
  estudianteId: string;
  instrumento: string;
  competencia: string;
  calificativo: 'C' | 'B' | 'A' | 'AD';
  observacion: string;
  fecha: string;
}

const INSTRUMENTOS = [
  'Lista de Cotejo',
  'Rúbrica de Evaluación',
  'Escala Valorativa',
  'Ficha de Observación',
  'Registro Anecdótico',
  'Portafolio de Evidencias',
  'Evaluación Diagnóstica',
  'Ficha de Análisis Literario'
];

const COMPETENCIAS = [
  'Lee textos diversos',
  'Produce textos escritos',
  'Interactúa oralmente'
];

const CALIFICATIVOS = [
  { valor: 'C', color: 'bg-red-500', label: 'En Inicio' },
  { valor: 'B', color: 'bg-yellow-500', label: 'En Proceso' },
  { valor: 'A', color: 'bg-green-500', label: 'Logrado' },
  { valor: 'AD', color: 'bg-blue-600', label: 'Logro Destacado' }
];

export default function CalificativosScreen() {
  const [estudiantes, setEstudiantes] = useState<Estudiante[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [estudianteSeleccionado, setEstudianteSeleccionado] = useState<Estudiante | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<Calificativo>({
    estudianteId: '',
    instrumento: INSTRUMENTOS[0],
    competencia: COMPETENCIAS[0],
    calificativo: 'B',
    observacion: '',
    fecha: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    const est = getEstudiantes();
    setEstudiantes(est);
  }, []);

  const estudiantesFiltrados = estudiantes.filter(e =>
    e.nombre.toLowerCase().includes(busqueda.toLowerCase())
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (estudianteSeleccionado) {
      guardarNota({
        ...formData,
        estudianteId: estudianteSeleccionado.id
      });
      setFormData({
        estudianteId: '',
        instrumento: INSTRUMENTOS[0],
        competencia: COMPETENCIAS[0],
        calificativo: 'B',
        observacion: '',
        fecha: new Date().toISOString().split('T')[0]
      });
      setShowForm(false);
      alert('✅ Calificativo registrado exitosamente');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-40 backdrop-blur-xl bg-slate-900/80 border-b border-cyan-500/20"
      >
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-black text-white mb-2">📊 Registro de Calificativos</h1>
              <p className="text-cyan-400/80">Ingresa los calificativos con instrumentos pedagógicos</p>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowForm(!showForm)}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold rounded-lg hover:shadow-lg hover:shadow-cyan-500/50 transition-all"
            >
              <Plus size={20} /> Nuevo Calificativo
            </motion.button>
          </div>
        </div>
      </motion.div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-3 gap-6 mb-8">
          {[
            { label: 'Total Estudiantes', value: estudiantes.length, icon: '👥' },
            { label: 'Instrumentos', value: INSTRUMENTOS.length, icon: '🎯' },
            { label: 'Competencias', value: COMPETENCIAS.length, icon: '⭐' }
          ].map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-gradient-to-br from-slate-800 to-slate-700 border border-cyan-500/20 rounded-xl p-6 hover:border-cyan-500/40 transition-all"
            >
              <div className="text-4xl mb-3">{stat.icon}</div>
              <div className="text-cyan-400/60 text-sm font-medium">{stat.label}</div>
              <div className="text-3xl font-bold text-white mt-2">{stat.value}</div>
            </motion.div>
          ))}
        </div>

        {/* Búsqueda */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-8"
        >
          <div className="relative">
            <Search className="absolute left-4 top-4 text-cyan-400/50" size={20} />
            <input
              type="text"
              placeholder="Buscar estudiante por nombre..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-slate-800 border border-cyan-500/20 rounded-lg text-white placeholder-cyan-400/40 focus:outline-none focus:border-cyan-500/50 transition-all"
            />
          </div>
        </motion.div>

        {/* Formulario */}
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-slate-800 to-slate-700 border border-cyan-500/30 rounded-xl p-8 mb-8"
          >
            <h2 className="text-2xl font-bold text-white mb-6">Nuevo Calificativo</h2>

            {estudianteSeleccionado ? (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                  <p className="text-white font-semibold">{estudianteSeleccionado.nombre}</p>
                  <p className="text-cyan-400/60 text-sm">Grado: {estudianteSeleccionado.grado}</p>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-cyan-400/80 text-sm font-medium mb-2">Instrumento *</label>
                    <select
                      value={formData.instrumento}
                      onChange={(e) => setFormData({...formData, instrumento: e.target.value})}
                      className="w-full bg-slate-700 border border-cyan-500/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-cyan-500/50"
                    >
                      {INSTRUMENTOS.map(inst => (
                        <option key={inst} value={inst}>{inst}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-cyan-400/80 text-sm font-medium mb-2">Competencia *</label>
                    <select
                      value={formData.competencia}
                      onChange={(e) => setFormData({...formData, competencia: e.target.value})}
                      className="w-full bg-slate-700 border border-cyan-500/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-cyan-500/50"
                    >
                      {COMPETENCIAS.map(comp => (
                        <option key={comp} value={comp}>{comp}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-cyan-400/80 text-sm font-medium mb-3">Calificativo *</label>
                  <div className="grid grid-cols-4 gap-3">
                    {CALIFICATIVOS.map(cal => (
                      <button
                        key={cal.valor}
                        type="button"
                        onClick={() => setFormData({...formData, calificativo: cal.valor as any})}
                        className={`py-3 rounded-lg font-bold transition-all ${
                          formData.calificativo === cal.valor
                            ? `${cal.color} text-white shadow-lg shadow-${cal.color.split('-')[1]}-500/50`
                            : 'bg-slate-700 text-cyan-400/60 hover:bg-slate-600'
                        }`}
                      >
                        <div className="text-2xl">{cal.valor}</div>
                        <div className="text-xs mt-1">{cal.label}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-cyan-400/80 text-sm font-medium mb-2">Observación</label>
                  <textarea
                    value={formData.observacion}
                    onChange={(e) => setFormData({...formData, observacion: e.target.value})}
                    placeholder="Comentarios sobre el desempeño..."
                    className="w-full bg-slate-700 border border-cyan-500/20 rounded-lg px-4 py-2 text-white placeholder-cyan-400/40 focus:outline-none focus:border-cyan-500/50 h-24 resize-none"
                  />
                </div>

                <div className="flex gap-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold py-3 rounded-lg hover:shadow-lg hover:shadow-green-500/50 transition-all"
                  >
                    ✓ Guardar Calificativo
                  </motion.button>
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="flex-1 bg-slate-700 text-white font-bold py-3 rounded-lg hover:bg-slate-600 transition-all"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            ) : (
              <p className="text-cyan-400/60">Selecciona un estudiante primero</p>
            )}
          </motion.div>
        )}

        {/* Lista de Estudiantes */}
        <div className="space-y-3">
          {estudiantesFiltrados.map((est, i) => (
            <motion.div
              key={est.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => {
                setEstudianteSeleccionado(est);
                setShowForm(true);
              }}
              className={`p-4 bg-gradient-to-r border rounded-lg cursor-pointer transition-all hover:border-cyan-500/50 ${
                estudianteSeleccionado?.id === est.id
                  ? 'from-cyan-500/20 to-blue-500/20 border-cyan-500/50 bg-cyan-500/10'
                  : 'from-slate-800 to-slate-700 border-cyan-500/20 hover:from-slate-750 hover:to-slate-650'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-white font-semibold">{est.nombre}</h3>
                  <p className="text-cyan-400/60 text-sm">Grado: {est.grado}</p>
                </div>
                <div className="text-right">
                  <Award className="text-cyan-400/60" size={24} />
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {estudiantesFiltrados.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <p className="text-cyan-400/50 text-lg">No se encontraron estudiantes</p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
