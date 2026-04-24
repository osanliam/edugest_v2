import { useState, useEffect } from 'react';
import { Plus, Trash2, Download, Save, AlertCircle } from 'lucide-react';

interface Student {
  id: string;
  name: string;
  score: number;
  course: string;
  grade: string;
  section: string;
}

interface Group {
  number: number;
  students: Student[];
  method: string;
}

interface SavedGroup {
  timestamp: string;
  groups: Group[];
  students: Student[];
  size: number;
}

export default function GroupsScreen() {
  const [students, setStudents] = useState<Student[]>([]);
  const [currentGroups, setCurrentGroups] = useState<Group[]>([]);
  const [groupHistory, setGroupHistory] = useState<Record<string, SavedGroup>>({});

  const [studentName, setStudentName] = useState('');
  const [studentScore, setStudentScore] = useState('50');
  const [course, setCourse] = useState('');
  const [grade, setGrade] = useState('');
  const [section, setSection] = useState('');
  const [groupSize, setGroupSize] = useState('4');
  const [method, setMethod] = useState('random');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');

  useEffect(() => {
    loadFromStorage();
  }, []);

  const loadFromStorage = () => {
    const saved = localStorage.getItem('groups_students');
    const savedHistory = localStorage.getItem('groups_history');

    if (saved) setStudents(JSON.parse(saved));
    if (savedHistory) setGroupHistory(JSON.parse(savedHistory));
  };

  const saveToStorage = (updatedStudents: Student[]) => {
    setStudents(updatedStudents);
    localStorage.setItem('groups_students', JSON.stringify(updatedStudents));
  };

  const showMessage = (text: string, type: 'success' | 'error') => {
    setMessage(text);
    setMessageType(type);
    setTimeout(() => setMessage(''), 3000);
  };

  const addStudent = () => {
    if (!studentName.trim()) {
      showMessage('Por favor ingresa el nombre del estudiante', 'error');
      return;
    }

    if (!grade || !section || !course) {
      showMessage('Por favor completa curso, grado y sección', 'error');
      return;
    }

    const newStudent: Student = {
      id: Date.now().toString(),
      name: studentName.trim(),
      score: Math.max(0, Math.min(100, parseInt(studentScore) || 50)),
      course,
      grade,
      section
    };

    const updated = [...students, newStudent];
    saveToStorage(updated);

    setStudentName('');
    setStudentScore('50');
    showMessage('Estudiante agregado correctamente', 'success');
  };

  const deleteStudent = (id: string) => {
    const updated = students.filter(s => s.id !== id);
    saveToStorage(updated);
  };

  const createGroups = () => {
    if (students.length === 0) {
      showMessage('Por favor agrega estudiantes primero', 'error');
      return;
    }

    const size = parseInt(groupSize);
    let sortedStudents = [...students];

    if (method === 'balanced') {
      sortedStudents.sort((a, b) => b.score - a.score);
    } else if (method === 'homogeneous') {
      sortedStudents.sort((a, b) => b.score - a.score);
    } else {
      for (let i = sortedStudents.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [sortedStudents[i], sortedStudents[j]] = [sortedStudents[j], sortedStudents[i]];
      }
    }

    const groups: Group[] = [];
    let groupNum = 1;

    if (method === 'balanced') {
      const groupArrays: Student[][] = [];
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
            method: 'Balanceado'
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
            method: 'Homogéneo'
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
            method: 'Sorteo'
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
        students,
        size: currentGroups[0]?.students.length || 0
      }
    };

    setGroupHistory(updated);
    localStorage.setItem('groups_history', JSON.stringify(updated));
    showMessage('Grupos guardados correctamente', 'success');
  };

  const clearAll = () => {
    if (confirm('¿Estás seguro de que deseas limpiar todos los estudiantes?')) {
      saveToStorage([]);
      setCurrentGroups([]);
      showMessage('Todo limpiado correctamente', 'success');
    }
  };

  const exportGroups = () => {
    if (currentGroups.length === 0) {
      showMessage('No hay grupos para exportar', 'error');
      return;
    }

    const data = {
      timestamp: new Date().toLocaleString(),
      groups: currentGroups,
      totalStudents: currentGroups.reduce((sum, g) => sum + g.students.length, 0)
    };

    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `grupos_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const methodDescriptions = {
    random: '🎲 Agrupa estudiantes al azar',
    balanced: '⚖️ Distribuye buenos y malos estudiantes equitativamente',
    homogeneous: '📊 Agrupa por nivel de rendimiento similar'
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-2">
            📊 Agrupador de Estudiantes
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Crea grupos de estudiantes de forma inteligente
          </p>
        </div>

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
          {/* Panel Izquierdo: Entrada de Datos */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                📚 Datos de Estudiantes
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Curso
                  </label>
                  <input
                    type="text"
                    value={course}
                    onChange={(e) => setCourse(e.target.value)}
                    placeholder="Ej: 5º A"
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Grado
                  </label>
                  <select
                    value={grade}
                    onChange={(e) => setGrade(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                  >
                    <option value="">Selecciona grado</option>
                    <option value="1">1º Primaria</option>
                    <option value="2">2º Primaria</option>
                    <option value="3">3º Primaria</option>
                    <option value="4">4º Primaria</option>
                    <option value="5">5º Primaria</option>
                    <option value="6">6º Primaria</option>
                    <option value="7">1º Secundaria</option>
                    <option value="8">2º Secundaria</option>
                    <option value="9">3º Secundaria</option>
                    <option value="10">4º Secundaria</option>
                    <option value="11">5º Secundaria</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Sección
                  </label>
                  <input
                    type="text"
                    value={section}
                    onChange={(e) => setSection(e.target.value)}
                    placeholder="Ej: A, B, C"
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                  />
                </div>

                <hr className="border-slate-300 dark:border-slate-600" />

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Nombre del Estudiante
                  </label>
                  <input
                    type="text"
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addStudent()}
                    placeholder="Ej: Juan Pérez"
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Calificación/Rendimiento
                  </label>
                  <input
                    type="number"
                    value={studentScore}
                    onChange={(e) => setStudentScore(e.target.value)}
                    placeholder="0-100"
                    min="0"
                    max="100"
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                  />
                </div>

                <button
                  onClick={addStudent}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition"
                >
                  <Plus size={20} /> Agregar Estudiante
                </button>
              </div>

              {/* Lista de Estudiantes */}
              <div className="mt-6">
                <h3 className="font-bold text-slate-900 dark:text-white mb-3">Estudiantes Cargados</h3>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {students.length === 0 ? (
                    <p className="text-slate-500 dark:text-slate-400 text-sm">Sin estudiantes aún</p>
                  ) : (
                    students.map(student => (
                      <div key={student.id} className="flex items-center justify-between bg-slate-100 dark:bg-slate-700 p-3 rounded">
                        <div className="flex-1">
                          <p className="font-medium text-slate-900 dark:text-white text-sm">{student.name}</p>
                          <p className="text-xs text-slate-600 dark:text-slate-400">
                            {student.course} • Grado {student.grade} • Sección {student.section} • Cal: {student.score}
                          </p>
                        </div>
                        <button
                          onClick={() => deleteStudent(student.id)}
                          className="bg-red-500 hover:bg-red-600 text-white p-1 rounded text-xs"
                        >
                          ✕
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <button
                onClick={clearAll}
                className="w-full mt-4 bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition"
              >
                <Trash2 size={20} /> Limpiar Todo
              </button>
            </div>
          </div>

          {/* Panel Derecho: Configuración */}
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
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg text-lg transition"
                >
                  🎯 CREAR GRUPOS
                </button>

                <button
                  onClick={saveGroups}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition"
                >
                  <Save size={20} /> Guardar Grupos
                </button>

                <button
                  onClick={exportGroups}
                  className="w-full bg-orange-600 hover:bg-orange-700 text-white font-medium py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition"
                >
                  <Download size={20} /> Exportar JSON
                </button>

                {Object.keys(groupHistory).length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Grupos Guardados
                    </label>
                    <select className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm">
                      <option value="">-- Selecciona --</option>
                      {Object.entries(groupHistory).map(([key, data]) => (
                        <option key={key} value={key}>
                          {data.timestamp} ({data.groups.length} grupos)
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Panel Resultados */}
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
                    const avgScore = (group.students.reduce((sum, s) => sum + s.score, 0) / group.students.length).toFixed(1);
                    return (
                      <div key={group.number} className="border border-slate-300 dark:border-slate-600 rounded-lg overflow-hidden">
                        <div className="bg-blue-600 text-white p-3 font-bold text-sm">
                          Grupo {group.number} ({group.students.length} est.) - Prom: {avgScore}
                        </div>
                        <ul className="p-3 space-y-2">
                          {group.students.map((student) => (
                            <li key={student.id} className="text-xs text-slate-700 dark:text-slate-300">
                              <strong>{student.name}</strong>
                              <div className="text-slate-500 dark:text-slate-400">
                                Cal: {student.score}
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
