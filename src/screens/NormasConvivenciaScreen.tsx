import { motion, AnimatePresence } from 'motion/react';
import { useState, useEffect } from 'react';
import { Shield, Trash2, Search, ChevronDown } from 'lucide-react';
import HeaderElegante from '../components/HeaderElegante';

interface Alumno {
  id: string;
  apellidos_nombres: string;
  grado: string;
  seccion: string;
}

interface Norma {
  id: string;
  num: number;
  texto: string;
}

interface EjeConvivencia {
  id: string;
  eje: string;
  icon: string;
  color: string;
  normaGeneral: string;
  normas: Norma[];
}

interface RegistroInfraccion {
  id: string;
  alumnoId: string;
  fecha: string;
  bimestre: number;
  ejeId: string;
  normaNumerro: number;
  normaTexto: string;
  tipo: 'cumplimiento' | 'incumplimiento';
  descripcion: string;
  accion: string;
  observaciones?: string;
  registradoPor: string;
  curso?: string;
}

const LS_ALUMNOS = 'ie_alumnos';
const LS_INFRACCIONES = 'ie_infracciones_v2';

function lsGet<T>(key: string, def: T): T {
  try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(def)); } catch { return def; }
}

function lsSet(key: string, val: any) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) { console.error('Error guardando:', e); }
}

const EJES_CONVIVENCIA: EjeConvivencia[] = [
  {
    id: 'eje-1',
    eje: 'Respeto y Buen Trato',
    icon: '🤝',
    color: '#00d9ff',
    normaGeneral: 'Promuevo relaciones basadas en la amabilidad, aceptación y reconocimiento del otro',
    normas: [
      { id: 'n1-1', num: 1, texto: 'Me comunico con lenguaje amable y respetuoso' },
      { id: 'n1-2', num: 2, texto: 'Reconozco y valoro las diferencias personales y culturales' },
      { id: 'n1-3', num: 3, texto: 'Escucho con atención las ideas y sentimientos de otros' },
      { id: 'n1-4', num: 4, texto: 'Fomento un ambiente donde todos se sientan seguros' },
    ]
  },
  {
    id: 'eje-2',
    eje: 'Responsabilidad y Cumplimiento',
    icon: '📋',
    color: '#69FF47',
    normaGeneral: 'Cumplo con mis deberes escolares y formativos, contribuyendo a un ambiente de orden',
    normas: [
      { id: 'n2-1', num: 1, texto: 'Ingreso puntualmente y participo activamente' },
      { id: 'n2-2', num: 2, texto: 'Mantengo presentación personal adecuada' },
      { id: 'n2-3', num: 3, texto: 'Cumplo con tareas y compromisos académicos' },
      { id: 'n2-4', num: 4, texto: 'Sigo las orientaciones del docente' },
    ]
  },
  {
    id: 'eje-3',
    eje: 'Convivencia Pacífica',
    icon: '☮️',
    color: '#B388FF',
    normaGeneral: 'Construyo relaciones positivas mediante diálogo, regulación emocional y cooperación',
    normas: [
      { id: 'n3-1', num: 1, texto: 'Dialogo para resolver diferencias buscando acuerdos' },
      { id: 'n3-2', num: 2, texto: 'Expreso mis emociones de manera adecuada' },
      { id: 'n3-3', num: 3, texto: 'Construyo relaciones basadas en empatía y cooperación' },
    ]
  },
  {
    id: 'eje-4',
    eje: 'Responsabilidad Digital',
    icon: '💻',
    color: '#FF9F00',
    normaGeneral: 'Utilizo tecnologías de manera segura, ética y orientada al aprendizaje',
    normas: [
      { id: 'n4-1', num: 1, texto: 'Utilizo dispositivos para aprender de forma segura' },
      { id: 'n4-2', num: 2, texto: 'Respeto la privacidad de compañeros' },
      { id: 'n4-3', num: 3, texto: 'Comportamiento ético y responsable en plataformas' },
      { id: 'n4-4', num: 4, texto: 'Cuido los equipos y recursos tecnológicos' },
    ]
  },
  {
    id: 'eje-5',
    eje: 'Cuidado de Espacios',
    icon: '🌿',
    color: '#FF3D5A',
    normaGeneral: 'Mantengo y preservo los espacios, bienes y recursos de la institución',
    normas: [
      { id: 'n5-1', num: 1, texto: 'Mantengo orden y limpieza en espacios compartidos' },
      { id: 'n5-2', num: 2, texto: 'Preservo bienes e infraestructura escolar' },
      { id: 'n5-3', num: 3, texto: 'Cuido y respeto los recursos naturales' },
    ]
  },
];

const CURSOS = ['Comunicación', 'Matemática', 'Ciencia y Tecnología', 'Historia', 'Inglés', 'Educación Física', 'Arte', 'Tutoría'];

export default function NormasConvivenciaScreen() {
  const [vista, setVista] = useState<'registro' | 'historial'>('registro');
  const [alumnos, setAlumnos] = useState<Alumno[]>([]);
  const [infracciones, setInfracciones] = useState<RegistroInfraccion[]>([]);

  // Filtros principales
  const [filtroGrado, setFiltroGrado] = useState('');
  const [filtroSeccion, setFiltroSeccion] = useState('');
  const [filtroBimestre, setFiltroBimestre] = useState('1');
  const [filtroCurso, setFiltroCurso] = useState('');

  // Formulario registro
  const [ejeSeleccionado, setEjeSeleccionado] = useState('eje-1');
  const [normaSeleccionada, setNormaSeleccionada] = useState<string | null>(null);
  const [tipoRegistro, setTipoRegistro] = useState<'cumplimiento' | 'incumplimiento'>('incumplimiento');
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [descripcion, setDescripcion] = useState('');
  const [accion, setAccion] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [alumnosSeleccionados, setAlumnosSeleccionados] = useState<Set<string>>(new Set());
  const [busquedaAlumnos, setBusquedaAlumnos] = useState('');

  // Historial
  const [busquedaHistorial, setBusquedaHistorial] = useState('');
  const [guardado, setGuardado] = useState(false);

  useEffect(() => {
    const lista = lsGet<Alumno[]>(LS_ALUMNOS, []);
    setAlumnos(lista);
    const infs = lsGet<RegistroInfraccion[]>(LS_INFRACCIONES, []);
    setInfracciones(infs);
    if (lista.length > 0) {
      setFiltroGrado(lista[0].grado);
    }
  }, []);

  const grados = [...new Set(alumnos.map(a => a.grado))].sort();
  const secciones = filtroGrado ? [...new Set(alumnos.filter(a => a.grado === filtroGrado).map(a => a.seccion))].sort() : [];

  const alumnosFiltrados = alumnos.filter(a =>
    (!filtroGrado || a.grado === filtroGrado) &&
    (!filtroSeccion || a.seccion === filtroSeccion) &&
    a.apellidos_nombres.toLowerCase().includes(busquedaAlumnos.toLowerCase())
  );

  const ejeActual = EJES_CONVIVENCIA.find(e => e.id === ejeSeleccionado) || EJES_CONVIVENCIA[0];

  const mostrarGuardado = () => {
    setGuardado(true);
    setTimeout(() => setGuardado(false), 2500);
  };

  const registrarInfraccion = () => {
    if (!normaSeleccionada || alumnosSeleccionados.size === 0) {
      alert('Selecciona una norma y al menos un alumno');
      return;
    }

    const norma = ejeActual.normas.find(n => n.id === normaSeleccionada);
    if (!norma) return;

    const todos = lsGet<RegistroInfraccion[]>(LS_INFRACCIONES, []);
    const bim = parseInt(filtroBimestre);

    alumnosSeleccionados.forEach(alumnoId => {
      todos.push({
        id: `inf-${Date.now()}-${Math.random()}`,
        alumnoId,
        fecha,
        bimestre: bim,
        ejeId: ejeSeleccionado,
        normaNumerro: norma.num,
        normaTexto: norma.texto,
        tipo: tipoRegistro,
        descripcion,
        accion,
        observaciones,
        registradoPor: 'Docente',
        curso: filtroCurso || undefined,
      });
    });

    lsSet(LS_INFRACCIONES, todos);
    setInfracciones(todos);
    setAlumnosSeleccionados(new Set());
    setDescripcion('');
    setAccion('');
    setObservaciones('');
    mostrarGuardado();
  };

  const eliminarInfraccion = (id: string) => {
    const todos = lsGet<RegistroInfraccion[]>(LS_INFRACCIONES, []);
    const filtrados = todos.filter(i => i.id !== id);
    lsSet(LS_INFRACCIONES, filtrados);
    setInfracciones(filtrados);
    mostrarGuardado();
  };

  const infraccionesAlumno = (alumnoId: string) =>
    infracciones.filter(i => i.alumnoId === alumnoId && i.bimestre === parseInt(filtroBimestre));

  const alumnosConRegistro = alumnos.filter(a => {
    const regs = infraccionesAlumno(a.id);
    const nombre = a.apellidos_nombres.toLowerCase();
    return regs.length > 0 && nombre.includes(busquedaHistorial.toLowerCase());
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-6">
      <div className="fixed inset-0 -z-50">
        <div className="absolute inset-0 bg-gradient-cyber opacity-60"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto space-y-6">
        <HeaderElegante icon={Shield} title="EDUGEST NORMAS DE CONVIVENCIA" subtitle="Registro y seguimiento de conducta" />

        {/* Pestañas */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex gap-3">
          {[
            { id: 'registro', label: '📝 Registrar Infracción' },
            { id: 'historial', label: '📊 Historial de Infracciones' }
          ].map(tab => (
            <motion.button
              key={tab.id}
              onClick={() => setVista(tab.id as any)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`px-6 py-3 rounded-xl font-semibold transition-all duration-200 ${
                vista === tab.id
                  ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/50'
                  : 'bg-slate-700/50 text-slate-300 hover:bg-slate-600/50'
              }`}
            >
              {tab.label}
            </motion.button>
          ))}
        </motion.div>

        {/* FILTROS PRINCIPALES */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 backdrop-blur-sm space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-xs uppercase font-semibold text-slate-400 mb-2 block">Grado</label>
              <select
                value={filtroGrado}
                onChange={(e) => {
                  setFiltroGrado(e.target.value);
                  setFiltroSeccion('');
                }}
                className="w-full px-4 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white focus:border-violet-500 focus:ring-violet-500/20 text-sm"
              >
                <option value="">Seleccionar grado</option>
                {grados.map(g => <option key={g} value={g}>{g}°</option>)}
              </select>
            </div>

            <div>
              <label className="text-xs uppercase font-semibold text-slate-400 mb-2 block">Sección</label>
              <select
                value={filtroSeccion}
                onChange={(e) => setFiltroSeccion(e.target.value)}
                disabled={!filtroGrado}
                className="w-full px-4 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white focus:border-violet-500 focus:ring-violet-500/20 text-sm disabled:opacity-50"
              >
                <option value="">Todas las secciones</option>
                {secciones.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div>
              <label className="text-xs uppercase font-semibold text-slate-400 mb-2 block">Bimestre</label>
              <select
                value={filtroBimestre}
                onChange={(e) => setFiltroBimestre(e.target.value)}
                className="w-full px-4 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white focus:border-violet-500 focus:ring-violet-500/20 text-sm"
              >
                <option value="1">I Bimestre</option>
                <option value="2">II Bimestre</option>
                <option value="3">III Bimestre</option>
                <option value="4">IV Bimestre</option>
              </select>
            </div>

            <div>
              <label className="text-xs uppercase font-semibold text-slate-400 mb-2 block">Curso</label>
              <select
                value={filtroCurso}
                onChange={(e) => setFiltroCurso(e.target.value)}
                className="w-full px-4 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white focus:border-violet-500 focus:ring-violet-500/20 text-sm"
              >
                <option value="">Todos los cursos</option>
                {CURSOS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
        </motion.div>

        {/* VISTA REGISTRO */}
        <AnimatePresence mode="wait">
          {vista === 'registro' && (
            <motion.div key="registro" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="grid grid-cols-1 lg:grid-cols-3 gap-6">

              {/* PANEL IZQUIERDO: Formulario */}
              <motion.div className="lg:col-span-1 bg-slate-800/50 border border-slate-700 rounded-xl p-6 backdrop-blur-sm space-y-4 h-fit max-h-[calc(100vh-300px)] overflow-y-auto">
                <h3 className="text-lg font-bold text-white">Registrar Infracción</h3>

                {/* Seleccionar Eje */}
                <div>
                  <label className="text-xs uppercase font-semibold text-slate-400 mb-2 block">Eje de Convivencia</label>
                  <div className="space-y-2">
                    {EJES_CONVIVENCIA.map(eje => (
                      <motion.button
                        key={eje.id}
                        onClick={() => {
                          setEjeSeleccionado(eje.id);
                          setNormaSeleccionada(null);
                        }}
                        className={`w-full px-3 py-2 rounded-lg text-left text-sm font-semibold border-2 transition-all ${
                          ejeSeleccionado === eje.id
                            ? 'border-white bg-slate-700'
                            : 'border-slate-600 bg-slate-800/30 hover:border-slate-500'
                        }`}
                        style={ejeSeleccionado === eje.id ? { borderColor: eje.color, color: eje.color } : {}}
                      >
                        {eje.icon} {eje.eje.split(' ')[0]}
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Norma General */}
                <div className="border-t border-slate-600 pt-3">
                  <p className="text-xs uppercase font-semibold mb-2" style={{ color: ejeActual.color }}>
                    {ejeActual.eje}
                  </p>
                  <p className="text-xs text-slate-300">{ejeActual.normaGeneral}</p>
                </div>

                {/* Seleccionar Norma */}
                <div>
                  <label className="text-xs uppercase font-semibold text-slate-400 mb-2 block">Selecciona la norma</label>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {ejeActual.normas.map(norma => (
                      <motion.button
                        key={norma.id}
                        onClick={() => setNormaSeleccionada(norma.id)}
                        className={`w-full px-3 py-2 rounded-lg text-left text-sm border-2 transition-all ${
                          normaSeleccionada === norma.id
                            ? 'border-white bg-slate-700'
                            : 'border-slate-600 bg-slate-800/30 hover:border-slate-500'
                        }`}
                        style={normaSeleccionada === norma.id ? { borderColor: ejeActual.color } : {}}
                      >
                        <span className="font-bold" style={{ color: ejeActual.color }}>{norma.num}.</span>
                        <span className="text-slate-200 text-xs ml-1">{norma.texto}</span>
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Tipo Infracción */}
                <div>
                  <label className="text-xs uppercase font-semibold text-slate-400 mb-2 block">Tipo</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { v: 'cumplimiento' as const, l: '✓ Cumplimiento', c: '#10b981' },
                      { v: 'incumplimiento' as const, l: '✗ Incumplimiento', c: '#ef4444' }
                    ].map(t => (
                      <motion.button
                        key={t.v}
                        onClick={() => setTipoRegistro(t.v)}
                        className={`px-3 py-2 rounded-lg text-xs font-semibold border-2 transition-all ${
                          tipoRegistro === t.v ? 'border-white bg-slate-700' : 'border-slate-600 bg-slate-800/30'
                        }`}
                        style={tipoRegistro === t.v ? { borderColor: t.c, color: t.c } : {}}
                      >
                        {t.l}
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Fecha */}
                <div>
                  <label className="text-xs uppercase font-semibold text-slate-400 mb-2 block">Fecha</label>
                  <input
                    type="date"
                    value={fecha}
                    onChange={(e) => setFecha(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white focus:border-violet-500 focus:ring-violet-500/20 text-sm"
                  />
                </div>

                {/* Descripción */}
                <div>
                  <label className="text-xs uppercase font-semibold text-slate-400 mb-2 block">Descripción</label>
                  <textarea
                    value={descripcion}
                    onChange={(e) => setDescripcion(e.target.value)}
                    rows={3}
                    placeholder="¿Qué sucedió?"
                    className="w-full px-3 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white focus:border-violet-500 focus:ring-violet-500/20 text-xs resize-none"
                  />
                </div>

                {/* Acción */}
                <div>
                  <label className="text-xs uppercase font-semibold text-slate-400 mb-2 block">Acción Tomada</label>
                  <textarea
                    value={accion}
                    onChange={(e) => setAccion(e.target.value)}
                    rows={2}
                    placeholder="¿Cómo se resolvió?"
                    className="w-full px-3 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white focus:border-violet-500 focus:ring-violet-500/20 text-xs resize-none"
                  />
                </div>

                {/* Observaciones */}
                <div>
                  <label className="text-xs uppercase font-semibold text-slate-400 mb-2 block">Observaciones</label>
                  <textarea
                    value={observaciones}
                    onChange={(e) => setObservaciones(e.target.value)}
                    rows={2}
                    placeholder="Notas adicionales..."
                    className="w-full px-3 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white focus:border-violet-500 focus:ring-violet-500/20 text-xs resize-none"
                  />
                </div>

                {/* Botón Registrar */}
                <motion.button
                  onClick={registrarInfraccion}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full px-4 py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 text-white font-bold rounded-lg hover:opacity-90 transition-all"
                >
                  📤 Registrar {alumnosSeleccionados.size > 0 ? `(${alumnosSeleccionados.size})` : ''}
                </motion.button>

                {guardado && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full px-4 py-2 bg-emerald-900/30 border border-emerald-600 text-emerald-100 font-semibold text-sm rounded-lg text-center">
                    ✓ Guardado
                  </motion.div>
                )}
              </motion.div>

              {/* PANEL DERECHO: Lista de Alumnos */}
              <motion.div className="lg:col-span-2 bg-slate-800/50 border border-slate-700 rounded-xl p-6 backdrop-blur-sm flex flex-col h-[calc(100vh-300px)]">
                <h3 className="text-lg font-bold text-white mb-4">
                  👥 Alumnos ({alumnosFiltrados.length})
                </h3>

                {/* Búsqueda */}
                <div className="mb-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Buscar alumno..."
                      value={busquedaAlumnos}
                      onChange={(e) => setBusquedaAlumnos(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white focus:border-violet-500 focus:ring-violet-500/20 text-sm"
                    />
                  </div>
                </div>

                {/* Botones Toggle */}
                <div className="flex gap-2 mb-4">
                  <motion.button
                    onClick={() => {
                      if (alumnosSeleccionados.size === alumnosFiltrados.length) {
                        setAlumnosSeleccionados(new Set());
                      } else {
                        setAlumnosSeleccionados(new Set(alumnosFiltrados.map(a => a.id)));
                      }
                    }}
                    className="px-4 py-2 rounded-lg bg-slate-700 border border-slate-600 text-slate-300 hover:bg-slate-600 text-sm font-semibold"
                  >
                    {alumnosSeleccionados.size === alumnosFiltrados.length ? '☑ Deseleccionar todos' : '☐ Seleccionar todos'}
                  </motion.button>
                </div>

                {/* Lista Scrollable */}
                <div className="flex-1 overflow-y-auto border-t border-slate-700">
                  <AnimatePresence>
                    {alumnosFiltrados.length === 0 ? (
                      <div className="p-8 text-center text-slate-400">
                        No hay alumnos en esta sección
                      </div>
                    ) : (
                      alumnosFiltrados.map((alumno, idx) => {
                        const isSelected = alumnosSeleccionados.has(alumno.id);
                        return (
                          <motion.div
                            key={alumno.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.02 }}
                            onClick={() => {
                              const newSet = new Set(alumnosSeleccionados);
                              if (newSet.has(alumno.id)) {
                                newSet.delete(alumno.id);
                              } else {
                                newSet.add(alumno.id);
                              }
                              setAlumnosSeleccionados(newSet);
                            }}
                            className={`px-4 py-3 border-b border-slate-700 cursor-pointer transition-all ${
                              isSelected ? 'bg-violet-600/20' : 'hover:bg-slate-700/30'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                                isSelected ? 'bg-violet-600 border-violet-400' : 'border-slate-600'
                              }`}>
                                {isSelected && <span className="text-white text-xs font-bold">✓</span>}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className={`font-semibold truncate ${isSelected ? 'text-white' : 'text-slate-200'}`}>
                                  {alumno.apellidos_nombres}
                                </p>
                                <p className="text-xs text-slate-400">{alumno.grado}° - Sección {alumno.seccion}</p>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* VISTA HISTORIAL */}
        <AnimatePresence mode="wait">
          {vista === 'historial' && (
            <motion.div key="historial" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
              {/* Búsqueda */}
              <div className="relative">
                <Search className="absolute left-4 top-3 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar alumno..."
                  value={busquedaHistorial}
                  onChange={(e) => setBusquedaHistorial(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 rounded-lg bg-slate-800/50 border border-slate-700 text-white focus:border-violet-500 focus:ring-violet-500/20"
                />
              </div>

              {/* Historial por Alumno */}
              <div className="space-y-3 max-h-[70vh] overflow-y-auto">
                {alumnosConRegistro.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 bg-slate-800/50 border border-slate-700 rounded-lg">
                    No hay registros de conducta
                  </div>
                ) : (
                  alumnosConRegistro.map(alumno => {
                    const registros = infraccionesAlumno(alumno.id);
                    const cumplimientos = registros.filter(r => r.tipo === 'cumplimiento').length;
                    const incumplimientos = registros.filter(r => r.tipo === 'incumplimiento').length;

                    return (
                      <details key={alumno.id} className="bg-slate-800/50 border border-slate-700 rounded-lg overflow-hidden">
                        <summary className="px-6 py-4 cursor-pointer hover:bg-slate-700/30 transition-colors flex items-center justify-between">
                          <div className="flex-1">
                            <p className="font-bold text-white">{alumno.apellidos_nombres}</p>
                            <p className="text-xs text-slate-400">{alumno.grado}° - Sección {alumno.seccion}</p>
                          </div>
                          <div className="flex items-center gap-4 text-sm">
                            <span className="text-emerald-400">✓ {cumplimientos}</span>
                            <span className="text-red-400">✗ {incumplimientos}</span>
                            <ChevronDown className="w-4 h-4 text-slate-400" />
                          </div>
                        </summary>

                        <div className="border-t border-slate-700 divide-y divide-slate-700">
                          {registros.map(reg => (
                            <div key={reg.id} className="px-6 py-4 bg-slate-800/30 space-y-2">
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                                      reg.tipo === 'cumplimiento' ? 'bg-emerald-600/30 text-emerald-300' : 'bg-red-600/30 text-red-300'
                                    }`}>
                                      {reg.tipo === 'cumplimiento' ? '✓ Cumplió' : '✗ Incumplió'}
                                    </span>
                                    <span className="text-xs text-slate-400">{reg.fecha}</span>
                                  </div>
                                  <p className="text-sm text-slate-200">
                                    <span style={{ color: EJES_CONVIVENCIA.find(e => e.id === reg.ejeId)?.color }}>
                                      {reg.ejeId}: {reg.normaNumerro}
                                    </span>
                                    {' - '}
                                    {reg.normaTexto}
                                  </p>
                                  <p className="text-xs text-slate-400 mt-1"><strong>Descripción:</strong> {reg.descripcion}</p>
                                  <p className="text-xs text-slate-400"><strong>Acción:</strong> {reg.accion}</p>
                                  {reg.observaciones && <p className="text-xs text-slate-400"><strong>Obs:</strong> {reg.observaciones}</p>}
                                  {reg.curso && <p className="text-xs text-slate-400"><strong>Curso:</strong> {reg.curso}</p>}
                                </div>
                                <motion.button
                                  onClick={() => eliminarInfraccion(reg.id)}
                                  whileHover={{ scale: 1.1 }}
                                  className="px-2 py-1 rounded bg-red-900/30 text-red-300 hover:bg-red-900/50 text-xs font-semibold flex-shrink-0"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </motion.button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </details>
                    );
                  })
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
