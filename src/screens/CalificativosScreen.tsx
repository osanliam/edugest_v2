import { useState, useEffect } from 'react';
import { Plus, Search, Award, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { getEstudiantes, getNotas, guardarNota, eliminarNota, calcularCalificativo, calcularCalificativoExamen } from '../services/dataService';

interface Estudiante {
  id: string;
  apellidos_nombres?: string;
  nombre?: string;
  grado?: string;
  seccion?: string;
}

interface Nota {
  id: string;
  estudianteId: string;
  competencia: string;
  instrumento: string;
  periodo: string;
  tipo: 'instrumento' | 'examen';
  totalItems: number;
  resueltos: number;
  calificativo: 'C' | 'B' | 'A' | 'AD';
  observacion: string;
  fecha: string;
}

const COMPETENCIAS = [
  'Lee textos diversos',
  'Produce textos escritos',
  'Interactúa oralmente',
];

const INSTRUMENTOS = [
  'Lista de Cotejo',
  'Rúbrica de Evaluación',
  'Escala Valorativa',
  'Ficha de Observación',
  'Registro Anecdótico',
  'Portafolio de Evidencias',
  'Ficha de Análisis Literario',
  'Examen Escrito',
];

const PERIODOS = ['Unidad 1', 'Unidad 2', 'Unidad 3', 'Unidad 4', 'Unidad 5', 'Unidad 6'];

const CAL_COLORES: Record<string, string> = {
  C:  'bg-red-500/20 text-red-300 border-red-500/40',
  B:  'bg-yellow-500/20 text-yellow-300 border-yellow-500/40',
  A:  'bg-green-500/20 text-green-300 border-green-500/40',
  AD: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
};

const CAL_LABEL: Record<string, string> = {
  C: 'En Inicio', B: 'En Proceso', A: 'Logro Esperado', AD: 'Logro Destacado',
};

function calcAuto(tipo: 'instrumento' | 'examen', resueltos: number, total: number): 'C' | 'B' | 'A' {
  return tipo === 'examen'
    ? calcularCalificativoExamen(resueltos, total)
    : calcularCalificativo(resueltos, total);
}

export default function CalificativosScreen() {
  const [estudiantes, setEstudiantes] = useState<Estudiante[]>([]);
  const [notas, setNotas] = useState<Nota[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [expandido, setExpandido] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [estSeleccionado, setEstSeleccionado] = useState<Estudiante | null>(null);

  const [competencia, setCompetencia] = useState(COMPETENCIAS[0]);
  const [instrumento, setInstrumento] = useState(INSTRUMENTOS[0]);
  const [periodo, setPeriodo] = useState(PERIODOS[0]);
  const [tipo, setTipo] = useState<'instrumento' | 'examen'>('instrumento');
  const [totalItems, setTotalItems] = useState(5);
  const [resueltos, setResueltos] = useState(0);
  const [adManual, setAdManual] = useState(false);
  const [observacion, setObservacion] = useState('');

  useEffect(() => {
    setEstudiantes(getEstudiantes());
    setNotas(getNotas());
  }, []);

  const recargar = () => setNotas(getNotas());

  const calAuto = calcAuto(tipo, resueltos, totalItems);
  const calFinal: 'C' | 'B' | 'A' | 'AD' = adManual && calAuto === 'A' ? 'AD' : calAuto;

  const handleGuardar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!estSeleccionado) return;
    guardarNota({
      estudianteId: estSeleccionado.id,
      competencia, instrumento, periodo, tipo,
      totalItems, resueltos,
      calificativo: calFinal,
      observacion,
      fecha: new Date().toISOString().split('T')[0],
    });
    recargar();
    setShowForm(false);
    setEstSeleccionado(null);
    setResueltos(0);
    setAdManual(false);
    setObservacion('');
  };

  const handleEliminar = (id: string) => {
    if (!confirm('¿Eliminar este calificativo?')) return;
    eliminarNota(id);
    recargar();
  };

  const abrirForm = (est: Estudiante) => {
    setEstSeleccionado(est);
    setShowForm(true);
    setExpandido(null);
  };

  const nombreEst = (e: Estudiante) => e.apellidos_nombres || e.nombre || '—';

  const filtrados = estudiantes.filter(e =>
    nombreEst(e).toLowerCase().includes(busqueda.toLowerCase())
  );

  const notasDeEst = (id: string) => notas.filter(n => n.estudianteId === id);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">

      {/* Header */}
      <div className="sticky top-0 z-40 backdrop-blur-xl bg-slate-900/80 border-b border-cyan-500/20">
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-3xl font-black text-white">📊 Registro de Calificativos</h1>
            <p className="text-cyan-400/70 text-sm mt-0.5">Escala MINEDU — sin notas numéricas</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            {Object.entries(CAL_LABEL).map(([k, v]) => (
              <span key={k} className={`px-2 py-1 rounded border text-xs font-bold ${CAL_COLORES[k]}`}>
                {k} = {v}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-5">

        {/* Búsqueda */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-cyan-400/50" size={17} />
          <input type="text" placeholder="Buscar estudiante..."
            value={busqueda} onChange={e => setBusqueda(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 text-sm" />
        </div>

        {/* Formulario */}
        {showForm && estSeleccionado && (
          <div className="bg-slate-800 border border-cyan-500/30 rounded-xl p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">
                ➕ Calificativo — {nombreEst(estSeleccionado)}
              </h2>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-white text-sm">✕ Cerrar</button>
            </div>

            <form onSubmit={handleGuardar} className="space-y-5">
              {/* Tipo */}
              <div>
                <label className="text-xs text-slate-400 uppercase mb-2 block">Tipo de evaluación</label>
                <div className="flex gap-3">
                  {(['instrumento', 'examen'] as const).map(t => (
                    <button key={t} type="button" onClick={() => { setTipo(t); setResueltos(0); }}
                      className={`px-5 py-2 rounded-lg font-semibold text-sm transition-all ${tipo === t ? 'bg-cyan-500 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}>
                      {t === 'instrumento' ? '📋 Instrumento' : '📝 Examen'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs text-slate-400 uppercase mb-1.5 block">Competencia</label>
                  <select value={competencia} onChange={e => setCompetencia(e.target.value)}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500">
                    {COMPETENCIAS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400 uppercase mb-1.5 block">Instrumento</label>
                  <select value={instrumento} onChange={e => setInstrumento(e.target.value)}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500">
                    {INSTRUMENTOS.map(i => <option key={i} value={i}>{i}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400 uppercase mb-1.5 block">Período</label>
                  <select value={periodo} onChange={e => setPeriodo(e.target.value)}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500">
                    {PERIODOS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>

              {/* Criterios */}
              <div className="bg-slate-700/50 rounded-xl p-5 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-slate-400 uppercase mb-1.5 block">
                      Total {tipo === 'instrumento' ? 'criterios' : 'preguntas'}
                    </label>
                    <input type="number" min={1} max={50} value={totalItems}
                      onChange={e => { setTotalItems(Number(e.target.value)); setResueltos(0); }}
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500" />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 uppercase mb-1.5 block">
                      {tipo === 'instrumento' ? 'Criterios logrados' : 'Respuestas correctas'}
                    </label>
                    <input type="number" min={0} max={totalItems} value={resueltos}
                      onChange={e => setResueltos(Math.min(Number(e.target.value), totalItems))}
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500" />
                  </div>
                </div>

                {/* Selector visual */}
                <div>
                  <p className="text-xs text-slate-400 mb-2">Toca para marcar {tipo === 'instrumento' ? 'criterios' : 'preguntas'} ({resueltos}/{totalItems}):</p>
                  <div className="flex flex-wrap gap-2">
                    {Array.from({ length: totalItems }, (_, i) => (
                      <button key={i} type="button"
                        onClick={() => setResueltos(i + 1 === resueltos ? i : i + 1)}
                        className={`w-9 h-9 rounded-lg text-xs font-bold transition-all ${i < resueltos ? 'bg-green-500 text-white' : 'bg-slate-600 text-slate-400 hover:bg-slate-500'}`}>
                        {i + 1}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Resultado */}
                <div className="flex items-center gap-4 pt-1">
                  <div className={`px-6 py-3 rounded-xl border text-3xl font-black ${CAL_COLORES[calFinal]}`}>
                    {calFinal}
                  </div>
                  <div>
                    <p className="text-white font-semibold">{CAL_LABEL[calFinal]}</p>
                    <p className="text-slate-400 text-xs">
                      {resueltos}/{totalItems} = {totalItems > 0 ? Math.round(resueltos / totalItems * 100) : 0}%
                    </p>
                  </div>
                  {calAuto === 'A' && (
                    <button type="button" onClick={() => setAdManual(v => !v)}
                      className={`ml-auto px-4 py-2 rounded-lg text-sm font-bold border transition-all ${adManual ? 'bg-blue-500/30 border-blue-400 text-blue-300' : 'bg-slate-700 border-slate-600 text-slate-400 hover:border-slate-500'}`}>
                      ⭐ Subir a AD
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 uppercase mb-1.5 block">Observación (opcional)</label>
                <textarea value={observacion} onChange={e => setObservacion(e.target.value)}
                  placeholder="Comentarios sobre el desempeño..."
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-500 h-20 resize-none" />
              </div>

              <div className="flex gap-3">
                <button type="submit"
                  className="flex-1 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold rounded-lg hover:opacity-90 transition-all">
                  ✓ Guardar Calificativo
                </button>
                <button type="button" onClick={() => setShowForm(false)}
                  className="px-6 py-2.5 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-all">
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Lista estudiantes */}
        {filtrados.length === 0 ? (
          <div className="text-center py-16 text-slate-500">
            {estudiantes.length === 0
              ? 'No hay alumnos registrados. Primero agrega alumnos en el módulo Alumnos.'
              : 'No se encontraron estudiantes'}
          </div>
        ) : (
          <div className="space-y-2">
            {filtrados.map(est => {
              const sus = notasDeEst(est.id);
              return (
                <div key={est.id} className="bg-slate-800/70 border border-slate-700/60 hover:border-cyan-500/30 rounded-xl overflow-hidden transition-all">
                  <div className="px-5 py-4 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                      {nombreEst(est).charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-semibold truncate">{nombreEst(est)}</p>
                      <div className="flex gap-2 flex-wrap mt-0.5 items-center">
                        {est.grado && <span className="text-xs text-slate-400">{est.grado}{est.seccion ? ` ${est.seccion}` : ''}</span>}
                        {sus.slice(-5).map(n => (
                          <span key={n.id} className={`px-1.5 py-0.5 rounded text-xs font-bold border ${CAL_COLORES[n.calificativo]}`}>
                            {n.calificativo}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-2 items-center">
                      <button onClick={() => abrirForm(est)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-cyan-500/15 hover:bg-cyan-500/30 rounded-lg text-cyan-400 text-xs font-semibold transition-all">
                        <Plus size={13} /> Calificativo
                      </button>
                      {sus.length > 0 && (
                        <button onClick={() => setExpandido(expandido === est.id ? null : est.id)}
                          className="p-2 bg-slate-700/60 hover:bg-slate-600 rounded-lg text-slate-400 transition-all">
                          {expandido === est.id ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                        </button>
                      )}
                    </div>
                  </div>

                  {expandido === est.id && sus.length > 0 && (
                    <div className="border-t border-slate-700/50 px-5 py-4 space-y-2">
                      <p className="text-xs text-slate-500 uppercase mb-2">Calificativos registrados</p>
                      {sus.map(n => (
                        <div key={n.id} className="flex items-center gap-3 bg-slate-700/40 rounded-lg px-4 py-2.5">
                          <span className={`px-3 py-1 rounded-lg font-black text-sm border min-w-[3rem] text-center ${CAL_COLORES[n.calificativo]}`}>
                            {n.calificativo}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-white text-sm truncate">{n.competencia}</p>
                            <p className="text-slate-400 text-xs">{n.instrumento} · {n.periodo} · {n.resueltos}/{n.totalItems}</p>
                            {n.observacion && <p className="text-slate-500 text-xs mt-0.5 truncate">{n.observacion}</p>}
                          </div>
                          <span className="text-xs text-slate-500 flex-shrink-0">{n.fecha}</span>
                          <button onClick={() => handleEliminar(n.id)}
                            className="p-1.5 bg-red-500/15 hover:bg-red-500/30 rounded-lg text-red-400 transition-all">
                            <Trash2 size={13} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
