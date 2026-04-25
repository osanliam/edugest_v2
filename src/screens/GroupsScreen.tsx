import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Download, Save, AlertCircle, RefreshCw, Users } from 'lucide-react';
import HeaderElegante from '../components/HeaderElegante';

interface Alumno {
  id: string;
  apellidos_nombres?: string;
  nombre?: string;
  apellido?: string;
  grado: string;
  seccion: string;
}

interface Calificativo {
  id: string;
  alumnoId: string;
  nota: number;
  [key: string]: any;
}

interface StudentGroup {
  id: string;
  nombre: string;
  apellido?: string;
  grado: string;
  seccion: string;
  promedio: number;
}

interface Group {
  number: number;
  students: StudentGroup[];
  method: string;
  seccion: string;
}

interface SavedGroup {
  timestamp: string;
  groups: Group[];
  size: number;
  method: string;
}

const GRADOS_SECUNDARIA = ['1°', '2°', '3°', '4°', '5°'];

export default function GroupsScreen() {
  const [alumnos, setAlumnos] = useState<StudentGroup[]>([]);
  const [grados, setGrados] = useState<string[]>([]);
  const [secciones, setSecciones] = useState<string[]>([]);
  const [selectedGrado, setSelectedGrado] = useState('');
  const [selectedSeccion, setSelectedSeccion] = useState('');
  const [currentGroups, setCurrentGroups] = useState<Group[]>([]);
  const [groupHistory, setGroupHistory] = useState<Record<string, SavedGroup>>({});

  const [groupSize, setGroupSize] = useState('4');
  const [method, setMethod] = useState('random');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  // Actualizar secciones disponibles cuando cambia el grado
  useEffect(() => {
    if (selectedGrado && alumnos.length > 0) {
      const seccionesFiltradas = Array.from(
        new Set(alumnos.filter(a => a.grado === selectedGrado).map(a => a.seccion))
      ).sort();
      setSecciones(seccionesFiltradas);
      setSelectedSeccion(seccionesFiltradas.length > 0 ? seccionesFiltradas[0] : '');
      setCurrentGroups([]);
    }
  }, [selectedGrado, alumnos]);

  const loadData = () => {
    setLoading(true);
    try {
      // Cargar alumnos
      const alumnosRaw = localStorage.getItem('ie_alumnos');
      const calificativosRaw = localStorage.getItem('ie_calificativos_v2');
      const savedHistoryRaw = localStorage.getItem('groups_history');

      const alumnosData: Alumno[] = alumnosRaw ? JSON.parse(alumnosRaw) : [];
      const calificativosData: Calificativo[] = calificativosRaw ? JSON.parse(calificativosRaw) : [];

      // Calcular promedios para todos los alumnos
      const alumnosConPromedio: StudentGroup[] = alumnosData.map(alumno => {
        const califAlumno = calificativosData.filter(c => c.alumnoId === alumno.id);
        const notas = califAlumno
          .map(c => c.nota)
          .filter(n => typeof n === 'number' && n > 0);

        const promedio = notas.length > 0
          ? Math.round((notas.reduce((a, b) => a + b, 0) / notas.length) * 100) / 100
          : 0;

        return {
          id: alumno.id,
          nombre: (alumno as any).apellidos_nombres || alumno.nombre || '',
          apellido: alumno.apellido || '',
          grado: alumno.grado,
          seccion: alumno.seccion,
          promedio
        };
      });

      setAlumnos(alumnosConPromedio);

      // Extraer grados únicos presentes en los alumnos, priorizando el orden de GRADOS_SECUNDARIA
      const gradosPresentes = GRADOS_SECUNDARIA.filter(g =>
        alumnosConPromedio.some(a => a.grado === g)
      );
      // También incluir cualquier otro grado que exista en los datos
      const otrosGrados = Array.from(new Set(alumnosConPromedio.map(a => a.grado)))
        .filter(g => !GRADOS_SECUNDARIA.includes(g))
        .sort();
      const todosGrados = [...gradosPresentes, ...otrosGrados];

      setGrados(todosGrados);

      const gradoInicial = todosGrados.length > 0 ? todosGrados[0] : '';
      setSelectedGrado(gradoInicial);

      if (gradoInicial) {
        const seccionesFiltradas = Array.from(
          new Set(alumnosConPromedio.filter(a => a.grado === gradoInicial).map(a => a.seccion))
        ).sort();
        setSecciones(seccionesFiltradas);
        setSelectedSeccion(seccionesFiltradas.length > 0 ? seccionesFiltradas[0] : '');
      }

      if (savedHistoryRaw) {
        setGroupHistory(JSON.parse(savedHistoryRaw));
      }
    } catch (error) {
      console.error('Error loading data:', error);
      showMessage('Error al cargar datos del sistema', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (text: string, type: 'success' | 'error') => {
    setMessage(text);
    setMessageType(type);
    setTimeout(() => setMessage(''), 3000);
  };

  const getAlumnosBySeccion = () => {
    return alumnos.filter(a => a.grado === selectedGrado && a.seccion === selectedSeccion);
  };

  const createGroups = () => {
    const alumnosSeccion = getAlumnosBySeccion();

    if (alumnosSeccion.length === 0) {
      showMessage('No hay estudiantes en esta sección', 'error');
      return;
    }

    const size = parseInt(groupSize);
    let sortedStudents = [...alumnosSeccion];

    if (method === 'balanced') {
      sortedStudents.sort((a, b) => b.promedio - a.promedio);
    } else if (method === 'homogeneous') {
      sortedStudents.sort((a, b) => b.promedio - a.promedio);
    } else {
      for (let i = sortedStudents.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [sortedStudents[i], sortedStudents[j]] = [sortedStudents[j], sortedStudents[i]];
      }
    }

    const groups: Group[] = [];
    let groupNum = 1;

    if (method === 'balanced') {
      const groupArrays: StudentGroup[][] = [];
      for (let i = 0; i < size; i++) {
        groupArrays[i] = [];
      }

      for (let i = 0; i < sortedStudents.length; i++) {
        const groupIndex = i % size;
        groupArrays[groupIndex].push(sortedStudents[i]);
      }

      groupArrays.forEach((group) => {
        if (group.length > 0) {
          groups.push({
            number: groupNum++,
            students: group,
            method: 'Balanceado',
            seccion: selectedSeccion
          });
        }
      });
    } else if (method === 'homogeneous') {
      for (let i = 0; i < sortedStudents.length; i += size) {
        const group = sortedStudents.slice(i, i + size);
        if (group.length > 0) {
          groups.push({
            number: groupNum++,
            students: group,
            method: 'Homogéneo',
            seccion: selectedSeccion
          });
        }
      }
    } else {
      for (let i = 0; i < sortedStudents.length; i += size) {
        const group = sortedStudents.slice(i, i + size);
        if (group.length > 0) {
          groups.push({
            number: groupNum++,
            students: group,
            method: 'Sorteo',
            seccion: selectedSeccion
          });
        }
      }
    }

    setCurrentGroups(groups);
    showMessage(`Grupos creados exitosamente (${groups.length} grupos)`, 'success');
  };

  const saveGroups = () => {
    if (currentGroups.length === 0) {
      showMessage('No hay grupos para guardar', 'error');
      return;
    }

    const timestamp = new Date().toLocaleString();
    const key = `groups_${Date.now()}`;

    const updated = {
      ...groupHistory,
      [key]: {
        timestamp,
        groups: currentGroups,
        size: currentGroups[0]?.students.length || 0,
        method: method
      }
    };

    setGroupHistory(updated);
    localStorage.setItem('groups_history', JSON.stringify(updated));
    showMessage('Grupos guardados correctamente', 'success');
  };

  const exportGroups = () => {
    if (currentGroups.length === 0) {
      showMessage('No hay grupos para exportar', 'error');
      return;
    }

    const data = {
      timestamp: new Date().toLocaleString(),
      grado: selectedGrado,
      seccion: selectedSeccion,
      groups: currentGroups.map(g => ({
        numero: g.number,
        estudiantes: g.students.map(s => ({
          nombre: ((s as any).apellidos_nombres || `${s.nombre || ''} ${s.apellido || ''}`).trim(),
          promedio: s.promedio
        })),
        promedio_grupo: (g.students.reduce((sum, s) => sum + s.promedio, 0) / g.students.length).toFixed(2)
      })),
      totalEstudiantes: currentGroups.reduce((sum, g) => sum + g.students.length, 0),
      metodo: method
    };

    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `grupos_${selectedGrado}_${selectedSeccion}_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showMessage('Grupos exportados como JSON', 'success');
  };

  const methodDescriptions = {
    random: '🎲 Agrupa estudiantes al azar',
    balanced: '⚖️ Distribuye buenos y malos estudiantes equitativamente',
    homogeneous: '📊 Agrupa por nivel de rendimiento similar'
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full border-4 border-slate-300 dark:border-slate-700 border-t-blue-600 animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Cargando datos...</p>
        </div>
      </div>
    );
  }

  const alumnosSeccion = getAlumnosBySeccion();

  return (
    <div className="min-h-screen bg-dark-bg text-white overflow-hidden p-6">
      {/* Fondo animado */}
      <div className="fixed inset-0 -z-50">
        <div className="absolute inset-0 bg-gradient-cyber opacity-60"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto space-y-8">
        <HeaderElegante
          icon={Users}
          title="EDUGEST AGRUPADOR"
          subtitle="Crea grupos de trabajo automáticamente desde el sistema"
        />

        {message && (
          <div className={`mb-4 p-4 rounded-lg flex items-center gap-3 ${
            messageType === 'success'
              ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
              : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
          }`}>
            <AlertCircle size={20} />
            {message}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Panel Izquierdo: Selección */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                📚 Seleccionar Sección
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Grado
                  </label>
                  {grados.length === 0 ? (
                    <div className="bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 p-3 rounded-lg text-sm">
                      No hay alumnos registrados. Agrega alumnos primero.
                    </div>
                  ) : (
                    <select
                      value={selectedGrado}
                      onChange={(e) => {
                        setSelectedGrado(e.target.value);
                        setCurrentGroups([]);
                      }}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-medium"
                    >
                      {grados.map(g => (
                        <option key={g} value={g}>
                          {g} Grado
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Sección
                  </label>
                  {secciones.length === 0 ? (
                    <div className="bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 p-3 rounded-lg text-sm">
                      No hay secciones para este grado
                    </div>
                  ) : (
                    <select
                      value={selectedSeccion}
                      onChange={(e) => {
                        setSelectedSeccion(e.target.value);
                        setCurrentGroups([]);
                      }}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-medium"
                    >
                      {secciones.map(sec => (
                        <option key={sec} value={sec}>
                          Sección {sec}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {alumnosSeccion.length > 0 && (
                  <div className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 p-3 rounded-lg text-sm">
                    <strong>{alumnosSeccion.length} estudiantes</strong> en esta sección
                  </div>
                )}

                <hr className="border-slate-300 dark:border-slate-600" />

                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white mb-3">Estudiantes</h3>
                  <div className="space-y-2 max-h-80 overflow-y-auto">
                    {alumnosSeccion.length === 0 ? (
                      <p className="text-slate-500 dark:text-slate-400 text-sm">Sin estudiantes</p>
                    ) : (
                      alumnosSeccion.map(student => (
                        <div key={student.id} className="flex items-center justify-between bg-slate-100 dark:bg-slate-700 p-3 rounded text-sm">
                          <div className="flex-1">
                            <p className="font-medium text-slate-900 dark:text-white">
                              {(student as any).apellidos_nombres || student.nombre || ''}
                            </p>
                            <p className="text-xs text-slate-600 dark:text-slate-400">
                              Grado {student.grado} • Promedio: {student.promedio}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <button
                  onClick={loadData}
                  className="w-full bg-slate-500 hover:bg-slate-600 text-white font-medium py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition"
                >
                  <RefreshCw size={20} /> Recargar Datos
                </button>
              </div>
            </div>
          </div>

          {/* Panel Centro: Configuración */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                🔧 Configuración
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Tamaño del Grupo
                  </label>
                  <select
                    value={groupSize}
                    onChange={(e) => setGroupSize(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                  >
                    <option value="2">2 estudiantes</option>
                    <option value="3">3 estudiantes</option>
                    <option value="4">4 estudiantes</option>
                    <option value="5">5 estudiantes</option>
                    <option value="6">6 estudiantes</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Método de Agrupación
                  </label>
                  <select
                    value={method}
                    onChange={(e) => setMethod(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                  >
                    <option value="random">🎲 Sorteo (Aleatorio)</option>
                    <option value="balanced">⚖️ Balanceado</option>
                    <option value="homogeneous">📊 Homogéneo</option>
                  </select>
                </div>

                <div className="bg-slate-100 dark:bg-slate-700 p-3 rounded text-sm text-slate-700 dark:text-slate-300">
                  {methodDescriptions[method as keyof typeof methodDescriptions]}
                </div>

                <button
                  onClick={createGroups}
                  disabled={alumnosSeccion.length === 0}
                  className="w-full bg-green-600 hover:bg-green-700 disabled:bg-slate-400 text-white font-bold py-3 px-4 rounded-lg text-lg transition"
                >
                  🎯 CREAR GRUPOS
                </button>

                <button
                  onClick={saveGroups}
                  disabled={currentGroups.length === 0}
                  className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-slate-400 text-white font-medium py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition"
                >
                  <Save size={20} /> Guardar Grupos
                </button>

                <button
                  onClick={exportGroups}
                  disabled={currentGroups.length === 0}
                  className="w-full bg-orange-600 hover:bg-orange-700 disabled:bg-slate-400 text-white font-medium py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition"
                >
                  <Download size={20} /> Exportar JSON
                </button>

                {Object.keys(groupHistory).length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Historial ({Object.keys(groupHistory).length})
                    </label>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {Object.entries(groupHistory).map(([key, data]) => (
                        <div key={key} className="bg-slate-100 dark:bg-slate-700 p-2 rounded text-xs text-slate-700 dark:text-slate-300">
                          <p className="font-medium">{data.timestamp}</p>
                          <p>{data.groups.length} grupos • {data.method}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Panel Derecho: Resultados */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                👥 Grupos Creados
              </h2>

              {currentGroups.length === 0 ? (
                <p className="text-slate-500 dark:text-slate-400 text-sm">Los grupos aparecerán aquí después de crear</p>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  <div className="bg-slate-100 dark:bg-slate-700 p-3 rounded text-sm">
                    <p className="text-slate-700 dark:text-slate-300">
                      <strong>Grado:</strong> {selectedGrado}
                    </p>
                    <p className="text-slate-700 dark:text-slate-300">
                      <strong>Sección:</strong> {selectedSeccion}
                    </p>
                    <p className="text-slate-700 dark:text-slate-300">
                      <strong>Total Grupos:</strong> {currentGroups.length}
                    </p>
                    <p className="text-slate-700 dark:text-slate-300">
                      <strong>Total Estudiantes:</strong> {currentGroups.reduce((sum, g) => sum + g.students.length, 0)}
                    </p>
                    <p className="text-slate-700 dark:text-slate-300">
                      <strong>Método:</strong> {currentGroups[0]?.method}
                    </p>
                  </div>

                  {currentGroups.map((group) => {
                    const avgScore = (group.students.reduce((sum, s) => sum + s.promedio, 0) / group.students.length).toFixed(1);
                    return (
                      <div key={group.number} className="border border-slate-300 dark:border-slate-600 rounded-lg overflow-hidden">
                        <div className="bg-blue-600 text-white p-3 font-bold text-sm">
                          Grupo {group.number} ({group.students.length} est.) - Prom: {avgScore}
                        </div>
                        <ul className="p-3 space-y-2">
                          {group.students.map((student) => (
                            <li key={student.id} className="text-xs text-slate-700 dark:text-slate-300">
                              <strong>{(student as any).apellidos_nombres || student.nombre || ''}</strong>
                              <div className="text-slate-500 dark:text-slate-400">
                                Promedio: {student.promedio}
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
