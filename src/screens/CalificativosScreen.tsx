import React, { useState, useEffect, useRef } from 'react';
import { Plus, X, Save, Settings, ChevronDown, ChevronRight, Edit2, Search, RefreshCw, Download, FileSpreadsheet } from 'lucide-react';
import * as XLSX from 'xlsx';
import { cargarTodo, guardarCalificativos, guardarUnCalificativo, guardarColumnas, getAsignaciones, getCalificacionesDesdeFecha, cargarCalPaginado, getCacheCalificaciones, setCacheCalificaciones, actualizarCalEnCache } from '../utils/apiClient';
import { guardarCalificativoFB, guardarCalificativosBatchFB, guardarColumnasFB, eliminarColumnaFB, eliminarCalificativosPorColumnaFB } from '../services/firebaseDataService';
import { exportarColumna, exportarTodas } from '../utils/exportCalificativos';

// ── Competencias ──────────────────────────────────────────────────────────────
const COMPETENCIAS = [
  { id: 'comp3', label: 'C1', nombre: 'Se comunica oralmente en lengua materna',             color: 'from-violet-500 to-purple-600',  text: 'text-violet-300',  bg: 'bg-violet-500/10',  headerBg: 'bg-violet-900/40',  promBg: 'bg-violet-500/20 border-violet-400/50 text-violet-200' },
  { id: 'comp1', label: 'C2', nombre: 'Lee diversos tipos de textos escritos en lengua materna', color: 'from-cyan-500 to-blue-600',   text: 'text-cyan-300',    bg: 'bg-cyan-500/10',    headerBg: 'bg-cyan-900/40',    promBg: 'bg-cyan-500/20 border-cyan-400/50 text-cyan-200'       },
  { id: 'comp2', label: 'C3', nombre: 'Escribe diversos tipos de textos en lengua materna',   color: 'from-emerald-500 to-teal-600',   text: 'text-emerald-300', bg: 'bg-emerald-500/10', headerBg: 'bg-emerald-900/40', promBg: 'bg-emerald-500/20 border-emerald-400/50 text-emerald-200' },
];

// ── Tipos de instrumento ──────────────────────────────────────────────────────
type TipoInstrumento = 'examen' | 'lista-cotejo' | 'ficha-observacion' | 'rubrica' | 'rubrica-2' | 'portafolio-evidencias' | 'registro-anecdotico' | 'escala-valoracion' | 'nota-numerica';

const TIPO_CONFIG: Record<string, { label: string; icono: string; puedeAD: boolean }> = {
  'lista-cotejo':           { label: 'Lista de Cotejo',          icono: '☑️', puedeAD: false },
  'ficha-observacion':      { label: 'Ficha de Observación',     icono: '🔍', puedeAD: false },
  'examen':                 { label: 'Examen',                  icono: '📝', puedeAD: false },
  'rubrica':                { label: 'Rúbrica',                  icono: '📐', puedeAD: true  },
  'rubrica-2':              { label: 'Rúbrica Mixta',             icono: '📋', puedeAD: true  },
  'portafolio-evidencias':  { label: 'Portafolio Evidencias',   icono: '📁', puedeAD: false },
  'registro-anecdotico':   { label: 'Registro Anecdótico',  icono: '📋', puedeAD: false },
  'escala-valoracion':    { label: 'Escala de Valoración', icono: '📊', puedeAD: false },
  'nota-numerica':       { label: 'Nota Numérica',        icono: '🔢', puedeAD: false },
};

function getTipoConfig(tipo: string) {
  return TIPO_CONFIG[tipo] || TIPO_CONFIG['lista-cotejo'];
}

// ── Escala ÚNICA para todos los instrumentos ──────────────────────────────────
// 100%      = A  (Logro Esperado)
// 99%–55%   = B  (En Proceso)
// 54%–0%    = C  (En Inicio)
// AD        = solo rúbrica, manual, cuando el alumno sobrepasa el 100%
function calcularEscala(_tipo: TipoInstrumento, pct: number): 'C' | 'B' | 'A' {
  return pct >= 100 ? 'A' : pct >= 55 ? 'B' : 'C';
}

// ── Interfaces ────────────────────────────────────────────────────────────────
interface Alumno {
  id: string;
  apellidos_nombres?: string;
  nombre?: string;
  grado?: string;
  seccion?: string;
}

interface ItemExamen {
  correcta: string;
  criterio?: string;
  descriptores?: string[];
}

interface Columna {
  id: string;
  nombre: string;
  tipo: TipoInstrumento;
  totalItems: number;
  competenciaId: string;
  bimestreId?: string;
  promediar: boolean;
  itemsExamen?: ItemExamen[];
  items?: string[];
  columnasEval?: string[];
  creatorId?: string; // email de quien creó la columna
}

interface Calificativo {
  alumnoId: string;
  columnaId: string;
  marcados: any[]; // string[] para examen/claves, string[][] para instrumentos, boolean[] legacy
  claves?: string[];
  notaNumerica?: number; // solo para nota-numerica: 0-20
  calificativo: 'C' | 'B' | 'A' | 'AD';
  esAD: boolean;
  fecha: string;
  // NUEVO: guardar el estado completo del instrumento para no perder notas/observaciones
  items?: any[]; // items del instrumento (indicadores, criterios, etc.)
  observaciones?: string[]; // observaciones por item
}

// ── Sin localStorage — todo va directo a Turso ────────────────────────────────

// ── Promedio por competencia ──────────────────────────────────────────────────
const CAL_VALOR: Record<string, number> = { C: 1, B: 2, A: 3, AD: 4 };
const VALOR_CAL: Record<number, 'C'|'B'|'A'|'AD'> = { 1: 'C', 2: 'B', 3: 'A', 4: 'AD' };

function promedioCompetencia(alumnoId: string, compId: string, columnas: Columna[], calificativos: Calificativo[]): 'C'|'B'|'A'|'AD'|null {
  const cols = columnas.filter(c => c.competenciaId === compId && c.promediar);
  if (cols.length === 0) return null;
  const vals = cols.map(c => calificativos.find(cal => cal.alumnoId === alumnoId && cal.columnaId === c.id)).filter(Boolean).map(cal => CAL_VALOR[cal!.calificativo]);
  if (vals.length === 0) return null;
  const r = Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
  return VALOR_CAL[Math.min(4, Math.max(1, r))];
}

// ── Colores escala ────────────────────────────────────────────────────────────
const CAL_BG: Record<string, string> = {
  C:  'bg-red-900 text-red-100 border-red-600',
  B:  'bg-amber-800 text-amber-100 border-amber-600',
  A:  'bg-emerald-900 text-emerald-100 border-emerald-600',
  AD: 'bg-violet-900 text-violet-100 border-violet-600',
};
const CAL_LABEL: Record<string, string> = {
  C: 'En Inicio', B: 'En Proceso', A: 'Logro Esperado', AD: 'Logro Destacado',
};
const LETRAS = ['A', 'B', 'C', 'D', 'E'] as const;

// ─────────────────────────────────────────────────────────────────────────────
// Pop-up EXAMEN  — ingresa la clave que marcó el alumno
// ─────────────────────────────────────────────────────────────────────────────
function PopupExamen({ alumno, columna, calActual, onGuardar, onCerrar }: {
  alumno: Alumno; columna: Columna; calActual?: Calificativo;
  onGuardar: (c: Calificativo) => void; onCerrar: () => void;
}) {
  const items = Array.isArray(columna.itemsExamen) ? columna.itemsExamen : Array(columna.totalItems).fill({ correcta: 'A' });
  const [claves, setClaves] = useState<string[]>(() => calActual?.claves ?? Array(columna.totalItems).fill(''));

  const marcar = (i: number, letra: string) => {
    const n = [...claves]; n[i] = n[i] === letra ? '' : letra; setClaves(n);
  };

  const correctas   = claves.filter((c, i) => c !== '' && c === items[i]?.correcta).length;
  const respondidas = claves.filter(c => c !== '').length;
  const pct         = columna.totalItems > 0 ? Math.round(correctas / columna.totalItems * 100) : 0;
  const calAuto     = calcularEscala('examen', pct);
  const marcados    = claves.map((c, i) => c !== '' && c === items[i]?.correcta);
  const nomAlumno   = alumno.apellidos_nombres || alumno.nombre || '—';

  return (
    <>
    <div className="fixed inset-0 z-50 bg-black/70" onClick={onCerrar} />
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-amber-600/50 rounded-2xl w-full max-w-2xl shadow-2xl max-h-[92vh] flex flex-col pointer-events-auto">

        {/* Header con datos del alumno SIEMPRE visibles */}
        <div className="px-6 py-4 border-b border-slate-700 flex-shrink-0 bg-gradient-to-r from-slate-800 to-slate-700 rounded-t-2xl">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-white font-black text-base">{nomAlumno}</p>
              <p className="text-slate-300 text-xs mt-0.5">{(alumno as any).grado}° "{(alumno as any).seccion}"</p>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <span className="px-3 py-1.5 bg-amber-800 border border-amber-600 text-amber-100 rounded-lg text-xs font-bold">📝 {columna.nombre}</span>
                <span className="text-xs text-slate-500">{columna.totalItems} preguntas</span>
                <span className="text-xs text-slate-500">Escala: 100%=A · 99–55%=B · ≤54%=C</span>
              </div>
            </div>
            <button onClick={onCerrar} className="p-1.5 hover:bg-slate-700 rounded-lg text-slate-400 flex-shrink-0"><X size={18}/></button>
          </div>
        </div>

        {/* Instrucción */}
        <div className="px-6 pt-3 pb-1 flex-shrink-0">
          <p className="text-xs text-slate-400">Marca la alternativa que eligió el alumno en cada pregunta. <span className="text-green-400 font-semibold">Verde = correcta</span> · <span className="text-red-400 font-semibold">Rojo = incorrecta</span>.</p>
        </div>

        {/* Tabla de preguntas */}
        <div className="flex-1 overflow-y-auto px-6 py-3">
          <table className="w-full text-xs border-collapse">
            <thead className="sticky top-0 bg-slate-800 z-10">
              <tr className="border-b border-slate-700 text-slate-400">
                <th className="text-left py-2 pr-3 font-semibold w-8">#</th>
                <th className="text-center py-2 font-semibold text-green-400 w-14">Clave</th>
                {LETRAS.map(l => <th key={l} className="text-center py-2 font-semibold w-11">{l}</th>)}
                <th className="text-center py-2 w-8">✓✗</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/40">
              {Array(columna.totalItems).fill(null).map((_, i) => {
                const correcta = items[i]?.correcta || 'A';
                const elegida  = claves[i] || '';
                const esCorr   = elegida !== '' && elegida === correcta;
                const esErr    = elegida !== '' && elegida !== correcta;
                return (
                  <tr key={i} className="hover:bg-slate-700/20">
                    <td className="py-1.5 pr-2 text-slate-400 font-bold">{i + 1}</td>
                    <td className="py-1.5 text-center">
                      <span className="inline-flex w-7 h-7 rounded-full bg-green-500/20 border border-green-500/50 text-green-300 font-black text-xs items-center justify-center">{correcta}</span>
                    </td>
                    {LETRAS.map(l => {
                      const esCorrectaBtn = l === correcta;
                      const esElegidaBtn  = l === elegida;
                      return (
                        <td key={l} className="py-1 text-center">
                          <button onClick={() => marcar(i, l)}
                            className={`w-9 h-9 rounded-lg font-bold text-xs transition-all border-2 ${
                              esElegidaBtn && esCorrectaBtn   ? 'bg-green-500 border-green-400 text-white shadow shadow-green-500/30'
                            : esElegidaBtn && !esCorrectaBtn  ? 'bg-red-500 border-red-400 text-white shadow shadow-red-500/30'
                            : esCorrectaBtn && elegida !== '' ? 'bg-green-500/15 border-green-500/30 text-green-500'
                            : 'bg-slate-700 border-slate-600 text-slate-400 hover:border-slate-400 hover:text-white'
                            }`}>
                            {l}
                          </button>
                        </td>
                      );
                    })}
                    <td className="py-1.5 text-center font-black">
                      {esCorr && <span className="text-green-400">✓</span>}
                      {esErr  && <span className="text-red-400">✗</span>}
                      {elegida === '' && <span className="text-slate-600">—</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Resultado */}
        <div className="px-6 py-4 border-t border-slate-700 flex-shrink-0 space-y-3">
          <div className="flex items-center gap-4 bg-slate-700/50 rounded-xl p-3">
            <div className={`w-14 h-14 rounded-xl border-2 flex items-center justify-center text-2xl font-black ${CAL_BG[calAuto]}`} translate="no">{calAuto}</div>
            <div className="flex-1">
              <p className="text-white font-bold">{CAL_LABEL[calAuto]}</p>
              <p className="text-slate-400 text-xs">{correctas}/{columna.totalItems} correctas = {pct}% · respondidas: {respondidas}</p>
            </div>
            <div className="text-right text-xs text-slate-500">
              <p>100% → A</p><p>99–55% → B</p><p>≤54% → C</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={() => onGuardar({ alumnoId: (alumno as any).id, columnaId: columna.id, marcados, claves, calificativo: calAuto, esAD: false, fecha: new Date().toISOString().split('T')[0] })}
              className="flex-1 py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 hover:opacity-90">
              <Save size={15}/> Guardar calificativo
            </button>
            <button onClick={onCerrar} className="px-5 py-2.5 bg-slate-700 text-white rounded-xl hover:bg-slate-600 text-sm">Cancelar</button>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Pop-up INSTRUMENTO (lista cotejo / ficha observación / portafolio / escala)  — máximo A
// ─────────────────────────────────────────────────────────────────────────────
interface ItemEditable {
  indicador: string;
  columnas: string[];
  respuestas: string[];
  observaciones: string;
}

function PopupNotaNumerica({ alumno, columna, calActual, onGuardar, onCerrar }: {
  alumno: Alumno; columna: Columna; calActual?: Calificativo;
  onGuardar: (c: Calificativo) => void; onCerrar: () => void;
}) {
  const notaDefault = calActual?.calificativo || 'C';
  const valorNota = (() => {
    if (calActual?.notaNumerica !== undefined) return calActual.notaNumerica;
    if (calActual?.calificativo === 'A') return 18;
    if (calActual?.calificativo === 'B') return 14;
    if (calActual?.calificativo === 'AD') return 20;
    return 11;
  })();
  
  const [nota, setNota] = useState<number>(valorNota || 11);
  const nomAlumno = alumno.apellidos_nombres || alumno.nombre || '—';
  
  const getCalificativo = (n: number): 'C'|'B'|'A'|'AD' => {
    if (n >= 18) return 'A';
    if (n >= 14) return 'B';
    if (n >= 11) return 'C';
    return 'C';
  };
  
  const cal = getCalificativo(nota);
  
  return (
    <>
    <div className="fixed inset-0 z-50 bg-black/70" onClick={onCerrar} />
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-emerald-600/50 rounded-2xl w-full max-w-md shadow-2xl pointer-events-auto">
        <div className="px-6 py-4 border-b border-slate-700 bg-gradient-to-r from-slate-800 to-slate-700 rounded-t-2xl">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-white font-black text-base">{nomAlumno}</p>
              <p className="text-slate-300 text-xs mt-0.5">{(alumno as any).grado}° "{(alumno as any).seccion}"</p>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <span className="px-3 py-1.5 bg-emerald-800 border border-emerald-600 text-emerald-100 rounded-lg text-xs font-bold">🔢 {columna.nombre}</span>
                <span className="text-xs text-slate-500">Nota Numérica (0-20)</span>
              </div>
            </div>
            <button onClick={onCerrar} className="p-1.5 hover:bg-slate-700 rounded-lg text-slate-400 flex-shrink-0"><X size={18}/></button>
          </div>
        </div>
        
        <div className="px-6 py-8 flex flex-col items-center">
          <label className="block text-xs text-slate-300 mb-4 font-semibold uppercase tracking-widest">Ingrese la nota (0-20)</label>
          <input
            type="number"
            min={0}
            max={20}
            value={nota}
            onChange={e => setNota(Math.max(0, Math.min(20, Number(e.target.value))))}
            className="w-32 text-center text-4xl font-black bg-slate-800 border-2 border-emerald-600 rounded-xl py-4 text-white focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/30"
          />
          <div className="flex gap-2 mt-6 flex-wrap justify-center">
            {[0,5,10,11,12,13,14,15,16,17,18,19,20].map(n => (
              <button key={n} onClick={() => setNota(n)} className={`w-10 h-10 rounded-lg font-bold text-sm transition-all ${nota === n ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/50' : 'bg-slate-700 text-slate-300 hover:bg-slate-600 hover:text-white'}`}>{n}</button>
            ))}
          </div>
        </div>
        
        <div className="px-6 py-4 border-t border-slate-700 flex items-center gap-4 bg-slate-700/50">
          <div className={`w-16 h-16 rounded-xl border-2 flex items-center justify-center text-3xl font-black ${CAL_BG[cal]}`} translate="no">{cal}</div>
          <div className="flex-1">
            <p className="text-white font-bold" translate="no">{CAL_LABEL[cal]}</p>
            <p className="text-slate-400 text-xs mt-0.5">18-20=A · 14-17=B · 11-13=C · 0-10=C</p>
          </div>
        </div>
        
        <div className="px-6 py-4 border-t border-slate-700 flex gap-3">
          <button onClick={() => onGuardar({ alumnoId: (alumno as any).id, columnaId: columna.id, marcados: [], notaNumerica: nota, calificativo: cal, esAD: false, fecha: new Date().toISOString().split('T')[0] })}
            className="flex-1 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 hover:opacity-90">
            <Save size={15}/> Guardar
          </button>
          <button onClick={onCerrar} className="px-5 py-2.5 bg-slate-700 text-white rounded-xl hover:bg-slate-600 text-sm">Cancelar</button>
        </div>
      </div>
    </div>
    </>
  );
}

function PopupInstrumento({ alumno, columna, calActual, onGuardar, onCerrar }: {
  alumno: Alumno; columna: Columna; calActual?: Calificativo;
  onGuardar: (c: Calificativo) => void; onCerrar: () => void;
}) {
  const cfg = TIPO_CONFIG[columna.tipo];
  
  const getColumnasInicio = () => {
    if (columna.columnasEval && columna.columnasEval.length > 0) return columna.columnasEval;
    switch (cfg.label) {
      case 'Lista de Cotejo': return ['Sí', 'No'];
      case 'Ficha de Observación': return ['Logrado', 'Parcial', 'No Logrado'];
      case 'Portafolio Evidencias': return ['Presentó', 'No Presentó'];
      case 'Escala de Valoración': return ['Siempre', 'Casi siempre', 'A veces', 'Rara vez', 'Nunca'];
      default: return ['Sí', 'No'];
    }
  };
  
  const inicialItems = (): ItemEditable[] => {
    if (calActual?.items?.length) return calActual.items;
    const cols = getColumnasInicio();
    return Array(columna.totalItems).fill(null).map((_, i) => ({
      indicador: columna.items?.[i] || `Indicador ${i + 1}`,
      columnas: cols,
      respuestas: Array(cols.length).fill(''),
      observaciones: ''
    }));
  };
  
  const [items, setItems] = useState<ItemEditable[]>(inicialItems);
  const [mostrarTabla, setMostrarTabla] = useState(true);

  const marcar = (i: number, colIdx: number, valor: string) => {
    const n = [...items];
    n[i].respuestas[colIdx] = n[i].respuestas[colIdx] === valor ? '' : valor;
    setItems(n);
  };

  const calcularCal = (): 'C' | 'B' | 'A' => {
    let positivos = 0;
    items.forEach(item => {
      if (item.respuestas.includes('Sí') || item.respuestas.includes('Logrado') || item.respuestas.includes('Presentó') || item.respuestas.includes('Siempre') || item.respuestas.includes('Casi siempre')) positivos++;
    });
    const pct = items.length > 0 ? Math.round(positivos / items.length * 100) : 0;
    return calcularEscala(columna.tipo, pct);
  };
  
  const cal = calcularCal();
  const nomAlumno = alumno.apellidos_nombres || alumno.nombre || '—';
  
  const getColumnas = () => {
    if (columna.columnasEval && columna.columnasEval.length > 0) return columna.columnasEval;
    switch (cfg.label) {
      case 'Lista de Cotejo': return ['Sí', 'No'];
      case 'Ficha de Observación': return ['Logrado', 'Parcial', 'No Logrado'];
      case 'Portafolio Evidencias': return ['Presentó', 'No Presentó'];
      case 'Escala de Valoración': return ['Siempre', 'Casi siempre', 'A veces', 'Rara vez', 'Nunca'];
      default: return ['Sí', 'No'];
    }
  };
  const colsLabel = getColumnas();

  return (
    <>
    <div className="fixed inset-0 z-50 bg-black/70" onClick={onCerrar} />
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-cyan-600/50 rounded-2xl w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto pointer-events-auto">

        <div className="px-6 py-4 border-b border-slate-700 bg-gradient-to-r from-slate-800 to-slate-700 rounded-t-2xl sticky top-0 z-10">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-white font-black text-base">{nomAlumno}</p>
              <p className="text-slate-300 text-xs mt-0.5">{(alumno as any).grado}° "{(alumno as any).seccion}"</p>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <span className="px-3 py-1.5 bg-cyan-800 border border-cyan-600 text-cyan-100 rounded-lg text-xs font-bold">{cfg.icono} {columna.nombre}</span>
                <span className="text-xs text-slate-500">{cfg.label} · {items.length} indicadores</span>
                <button onClick={() => setMostrarTabla(!mostrarTabla)} className="text-xs text-cyan-400 underline">
                  {mostrarTabla ? 'Ocultar' : 'Mostrar'} tabla
                </button>
              </div>
            </div>
            <button onClick={onCerrar} className="p-1.5 hover:bg-slate-700 rounded-lg text-slate-400 flex-shrink-0"><X size={18}/></button>
          </div>
        </div>

        {mostrarTabla && (
          <div className="px-6 py-4 space-y-3">
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-600">
                    <th className="text-left py-2 px-2 text-slate-400">#</th>
                    <th className="text-left py-2 px-2 text-slate-400 min-w-[200px]">Indicador</th>
                    {colsLabel.map((col, i) => (
                      <th key={i} className="text-center py-2 px-2 text-slate-400">{col}</th>
                    ))}
                    <th className="text-left py-2 px-2 text-slate-400">Observación</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, i) => (
                    <tr key={i} className="border-b border-slate-700/40">
                      <td className="py-2 px-2 text-slate-500">{i + 1}</td>
                      <td className="py-2 px-2">
                        <input 
                          type="text" 
                          value={item.indicador}
                          onChange={(e) => {
                            const n = [...items];
                            n[i].indicador = e.target.value;
                            setItems(n);
                          }}
                          className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1 text-white text-xs"
                        />
                      </td>
                      {item.respuestas.map((resp, j) => (
                        <td key={j} className="text-center py-2 px-1">
                          <button
                            onClick={() => marcar(i, j, colsLabel[j])}
                            className={`w-10 h-8 rounded font-bold text-xs transition-all ${
                              resp === colsLabel[j] 
                                ? 'bg-green-500 border-green-400 text-white' 
                                : 'bg-slate-700 border-slate-600 text-slate-400 hover:border-slate-500'
                            }`}
                          >
                            {colsLabel[j].charAt(0)}
                          </button>
                        </td>
                      ))}
                      <td className="py-2 px-2">
                        <input 
                          type="text" 
                          placeholder="Observación..."
                          value={item.observaciones || ''}
                          onChange={(e) => {
                            const n = [...items];
                            n[i].observaciones = e.target.value;
                            setItems(n);
                          }}
                          className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1 text-white text-xs"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <button 
              onClick={() => setItems([...items, { indicador: `Indicador ${items.length + 1}`, columnas: colsLabel, respuestas: Array(colsLabel.length).fill(''), observaciones: '' }])}
              className="text-xs text-cyan-400 hover:underline"
            >
              + Agregar indicador
            </button>
          </div>
        )}

        <div className="px-6 py-4 border-t border-slate-700 flex items-center gap-4 bg-slate-700/50 sticky bottom-0">
          <div className={`w-16 h-16 rounded-xl border-2 flex items-center justify-center text-3xl font-black ${CAL_BG[cal]}`} translate="no">{cal}</div>
          <div className="flex-1">
            <p className="text-white font-bold" translate="no">{CAL_LABEL[cal]}</p>
            <p className="text-slate-400 text-xs mt-0.5">100%=A · 99–55%=B · ≤54%=C</p>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-slate-700 flex gap-3">
          <button onClick={() => onGuardar({
              alumnoId: (alumno as any).id,
              columnaId: columna.id,
              marcados: items.map(i => i.respuestas),
              calificativo: cal,
              esAD: false,
              fecha: new Date().toISOString().split('T')[0],
              items: items.map(i => ({ indicador: i.indicador, respuestas: i.respuestas })),
              observaciones: items.map(i => i.observaciones || ''),
            })}
            className="flex-1 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 hover:opacity-90">
            <Save size={15}/> Guardar
          </button>
<button onClick={onCerrar} className="px-5 py-2.5 bg-slate-700 text-white rounded-xl hover:bg-slate-600 text-sm">Cancelar</button>
          </div>
        </div>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Rúbrica Mixta types & helpers
// ─────────────────────────────────────────────────────────────────────────────
interface ItemRubrica2Row {
  criterio: string;
  clave: string;
  tipo: 'alternativa' | 'descriptor';
  respuesta: string;
  nivel: string;
  descriptores: string[];
}

const RUB2_LEVELS = ['C', 'B', 'A', 'AD'] as const;
const RUB2_LEVEL_LABELS: Record<string, string> = { C: 'INICIO', B: 'PROCESO', A: 'LOGRO', AD: 'LOGRO DESTACADO' };
const RUB2_CELL_COLORS: Record<string, string> = {
  C: 'bg-red-500 border-red-400 text-white',
  B: 'bg-amber-500 border-amber-400 text-white',
  A: 'bg-emerald-500 border-emerald-400 text-white',
  AD: 'bg-blue-500 border-blue-400 text-white',
};

function calcularCalRubrica2(rows: ItemRubrica2Row[]): { calificativo: 'C'|'B'|'A'|'AD'; pctAlt: number; baseAlt: 'C'|'B'|'A'; rubAvg: number; hasAD: boolean; allAnswered: boolean } {
  const altRows = rows.filter(r => r.tipo === 'alternativa');
  const descRows = rows.filter(r => r.tipo === 'descriptor');
  const altTotalConClave = altRows.filter(r => r.clave && r.clave.trim() !== '').length;
  const altCorrectas = altRows.filter(r => r.clave && r.respuesta === r.clave).length;
  const altRespondidas = altRows.filter(r => r.respuesta).length;
  const altTodasCorrectas = altTotalConClave > 0 && altCorrectas === altTotalConClave && altRespondidas === altTotalConClave;
  const pctAlt = altTotalConClave > 0 ? altCorrectas / altTotalConClave : 0;
  const sinAlternativas = altTotalConClave === 0;
  const sinRubrica = descRows.length === 0;
  const allAnswered = altRows.every(r => r.respuesta) && descRows.every(r => r.nivel);

  const descPcts = descRows.map(r => {
    const n = r.nivel;
    return n === 'AD' ? 4 : n === 'A' ? 3 : n === 'B' ? 2 : n === 'C' ? 1 : 0;
  });
  const rubAvg = descPcts.length > 0 ? descPcts.reduce((a, b) => a + b, 0) / descPcts.length : 0;
  const hasAD = descPcts.some(p => p === 4);

  // baseAlt = calificativo basado solo en alternativas
  let baseAlt: 'C'|'B'|'A' = 'C';
  if (sinAlternativas || altTotalConClave === 0) baseAlt = 'C';
  else if (pctAlt >= 0.75) baseAlt = 'A';
  else if (pctAlt >= 0.45) baseAlt = 'B';

  if (sinAlternativas && sinRubrica) return { calificativo: 'C', pctAlt: 0, baseAlt: 'C', rubAvg: 0, hasAD: false, allAnswered };

  // Solo alternativas (sin descriptores)
  if (sinRubrica) {
    if (altTodasCorrectas) return { calificativo: 'A', pctAlt, baseAlt: 'A', rubAvg: 0, hasAD: false, allAnswered };
    if (pctAlt >= 0.9) return { calificativo: 'A', pctAlt, baseAlt: 'A', rubAvg: 0, hasAD: false, allAnswered };
    if (pctAlt >= 0.55) return { calificativo: 'B', pctAlt, baseAlt: 'B', rubAvg: 0, hasAD: false, allAnswered };
    return { calificativo: 'C', pctAlt, baseAlt: 'C', rubAvg: 0, hasAD: false, allAnswered };
  }

  // Solo descriptores (sin alternativas)
  if (sinAlternativas) {
    if (allAnswered && hasAD) return { calificativo: 'AD', pctAlt, baseAlt: 'C', rubAvg, hasAD, allAnswered };
    if (allAnswered && rubAvg >= 3) return { calificativo: 'A', pctAlt, baseAlt: 'C', rubAvg, hasAD, allAnswered };
    if (allAnswered && rubAvg >= 2) return { calificativo: 'B', pctAlt, baseAlt: 'C', rubAvg, hasAD, allAnswered };
    if (allAnswered) return { calificativo: 'C', pctAlt, baseAlt: 'C', rubAvg, hasAD, allAnswered };
    return { calificativo: 'C', pctAlt: 0, baseAlt: 'C', rubAvg, hasAD, allAnswered };
  }

  // Mixto: alternativas + descriptores
  // Si TODAS las alternativas están correctas (base A) y al menos un descriptor es AD → calificativo AD
  if (altTodasCorrectas && hasAD) return { calificativo: 'AD', pctAlt, baseAlt: 'A', rubAvg, hasAD, allAnswered };
  if (altTodasCorrectas && rubAvg >= 3) return { calificativo: 'A', pctAlt, baseAlt: 'A', rubAvg, hasAD, allAnswered };
  if (altTodasCorrectas && rubAvg >= 2) return { calificativo: 'A', pctAlt, baseAlt: 'A', rubAvg, hasAD, allAnswered };
  if (altTodasCorrectas) return { calificativo: 'A', pctAlt, baseAlt: 'A', rubAvg, hasAD, allAnswered };

  // baseAlt A (>=75%) con descriptores
  if (baseAlt === 'A' && hasAD) return { calificativo: 'AD', pctAlt, baseAlt, rubAvg, hasAD, allAnswered };
  if (baseAlt === 'A' && rubAvg >= 3) return { calificativo: 'A', pctAlt, baseAlt, rubAvg, hasAD, allAnswered };
  if (baseAlt === 'A') return { calificativo: 'A', pctAlt, baseAlt, rubAvg, hasAD, allAnswered };

  // baseAlt B (45-74%) con descriptores
  if (baseAlt === 'B' && hasAD) return { calificativo: 'A', pctAlt, baseAlt, rubAvg, hasAD, allAnswered };
  if (baseAlt === 'B') return { calificativo: 'B', pctAlt, baseAlt, rubAvg, hasAD, allAnswered };

  return { calificativo: 'C', pctAlt, baseAlt: 'C', rubAvg, hasAD, allAnswered };
}

// ─────────────────────────────────────────────────────────────────────────────
// Pop-up RÚBRICA MIXTA — estilo examen: alternativas + descriptores
// ─────────────────────────────────────────────────────────────────────────────
function PopupRubrica2({ alumno, columna, calActual, onGuardar, onCerrar }: {
  alumno: Alumno; columna: Columna; calActual?: Calificativo;
  onGuardar: (c: Calificativo) => void; onCerrar: () => void;
}) {
  const itemsConfig = Array.isArray(columna.itemsExamen) ? columna.itemsExamen : [];
  const ALT_LETRAS = ['A', 'B', 'C', 'D'] as const;

  const altItems = itemsConfig.filter((it: any) => it.tipo === 'alternativa');
  const descItems = itemsConfig.filter((it: any) => it.tipo === 'descriptor');

  const initRows = (): ItemRubrica2Row[] => {
    const num = itemsConfig.length || columna.totalItems || 2;
    if (calActual?.items?.length) {
      return calActual.items.map((it: any, idx: number) => {
        const cfg = itemsConfig[idx] || {};
        const tipo = (cfg.tipo as 'alternativa' | 'descriptor') || (cfg.correcta && cfg.correcta.trim() ? 'alternativa' : 'descriptor');
        return {
          criterio: it.criterio || cfg.criterio || '',
          clave: it.clave || it.correcta || cfg.correcta || '',
          tipo,
          respuesta: it.respuesta || '',
          nivel: it.nivel || '',
          descriptores: cfg.descriptores?.length === 4 ? [...cfg.descriptores] : Array(4).fill('') as string[],
        };
      });
    }
    if (itemsConfig.length > 0) {
      return itemsConfig.map((cfg: any) => ({
        criterio: cfg.criterio || '',
        clave: cfg.correcta || '',
        tipo: (cfg.tipo as 'alternativa' | 'descriptor') || (cfg.correcta && cfg.correcta.trim() ? 'alternativa' : 'descriptor'),
        respuesta: '',
        nivel: '',
        descriptores: (cfg.descriptores?.length === 4 ? [...cfg.descriptores] : Array(4).fill('')) as string[],
      }));
    }
    return Array(num).fill(null).map((_, i) => ({
      criterio: `Ítem ${i + 1}`,
      clave: '',
      tipo: 'alternativa' as const,
      respuesta: '',
      nivel: '',
      descriptores: Array(4).fill('') as string[],
    }));
  };

  const [rows, setRows] = useState<ItemRubrica2Row[]>(initRows);
  const [esAD, setEsAD] = useState(calActual?.esAD ?? false);
  const nomAlumno = alumno.apellidos_nombres || alumno.nombre || '—';

  const altRows = rows.filter(r => r.tipo === 'alternativa');
  const descRows = rows.filter(r => r.tipo === 'descriptor');

  const marcarAlt = (rowIdx: number, letra: string) => {
    setRows(prev => {
      const n = [...prev];
      n[rowIdx] = { ...n[rowIdx], respuesta: n[rowIdx].respuesta === letra ? '' : letra };
      return n;
    });
  };

  const marcarNivel = (rowIdx: number, nivel: string) => {
    setRows(prev => {
      const n = [...prev];
      n[rowIdx] = { ...n[rowIdx], nivel: n[rowIdx].nivel === nivel ? '' : nivel };
      return n;
    });
  };

  const resultado = calcularCalRubrica2(rows);
  const altCorrectas = altRows.filter(r => r.clave && r.respuesta === r.clave).length;
  const altTotalConClave = altRows.filter(r => r.clave && r.clave.trim() !== '').length;
  const pctAlt = altTotalConClave > 0 ? Math.round(altCorrectas / altTotalConClave * 100) : 0;
  const calFinal: 'C'|'B'|'A'|'AD' = esAD && resultado.calificativo === 'A' ? 'AD' : resultado.calificativo;

  return (
    <>
    <div className="fixed inset-0 z-50 bg-black/70" onClick={onCerrar} />
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-purple-500/30 rounded-2xl w-full max-w-4xl shadow-2xl max-h-[92vh] flex flex-col pointer-events-auto">

        <div className="px-6 py-4 border-b border-slate-700 flex-shrink-0 bg-gradient-to-r from-slate-800 to-slate-700 rounded-t-2xl">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-white font-black text-base" translate="no">{nomAlumno}</p>
              <p className="text-slate-300 text-xs mt-0.5">{(alumno as any).grado}° "{(alumno as any).seccion}"</p>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <span className="px-3 py-1.5 bg-purple-800 border border-purple-500/40 text-purple-200 rounded-lg text-xs font-bold">📋 {columna.nombre}</span>
                <span className="text-xs text-slate-500">Rúbrica Mixta · {rows.length} ítems</span>
                {altTotalConClave > 0 && <span className="text-xs text-green-400" translate="no">Alt: {altCorrectas}/{altTotalConClave} ({pctAlt}%)</span>}
              </div>
            </div>
            <button onClick={onCerrar} className="p-1.5 hover:bg-slate-700 rounded-lg text-slate-400 flex-shrink-0"><X size={18}/></button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-3 space-y-4">
          {/* SECCIÓN 1: Alternativas */}
          {altRows.length > 0 && (
          <div>
            <h4 className="text-xs text-amber-400 font-bold uppercase tracking-wider mb-2">Alternativas — marca la respuesta del alumno</h4>
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-600">
                  <th className="text-left py-2 pr-3 font-semibold w-6 text-slate-400">#</th>
                  <th className="text-left py-2 font-semibold text-slate-400 min-w-[100px]">Criterio</th>
                  <th className="text-center py-2 font-semibold text-green-400 w-10">Clave</th>
                  {ALT_LETRAS.map(l => <th key={l} className="text-center py-2 font-semibold w-9 text-slate-300" translate="no">{l}</th>)}
                  <th className="text-center py-2 w-8">✓✗</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/40">
                {altRows.map((row, idx) => {
                  const i = rows.indexOf(row);
                  const tieneClave = row.clave && row.clave.trim() !== '';
                  const esCorr = tieneClave && row.respuesta === row.clave;
                  const esErr = tieneClave && row.respuesta && row.respuesta !== row.clave;
                  return (
                    <tr key={i} className="hover:bg-slate-700/20">
                      <td className="py-1.5 pr-2 text-slate-400 font-bold">{idx + 1}</td>
                      <td className="py-1.5 text-white text-xs font-medium">{row.criterio || `Ítem ${i + 1}`}</td>
                      <td className="py-1.5 text-center">
                        {tieneClave ? (
                          <span className={`inline-flex w-7 h-7 rounded-full font-black text-xs items-center justify-center ${esCorr ? 'bg-green-500/20 border border-green-500/50 text-green-300' : esErr ? 'bg-red-500/20 border border-red-500/50 text-red-300' : 'bg-slate-600 border border-slate-500 text-slate-400'}`} translate="no">{row.clave}</span>
                        ) : (
                          <span className="text-slate-600 text-xs">—</span>
                        )}
                      </td>
                      {ALT_LETRAS.map(l => {
                        const esElegida = row.respuesta === l;
                        const esCorrectaBtn = tieneClave && l === row.clave;
                        return (
                          <td key={l} className="py-1 text-center">
                            <button onClick={() => marcarAlt(i, l)}
                              className={`w-8 h-8 rounded-lg font-bold text-xs transition-all border-2 ${
                                esElegida && esCorrectaBtn   ? 'bg-green-500 border-green-400 text-white shadow shadow-green-500/30'
                              : esElegida && !esCorrectaBtn  ? 'bg-red-500 border-red-400 text-white shadow shadow-red-500/30'
                              : esCorrectaBtn && row.respuesta !== '' ? 'bg-green-500/15 border-green-500/30 text-green-500'
                              : 'bg-slate-700 border-slate-600 text-slate-400 hover:border-slate-400 hover:text-white'
                              }`} translate="no">
                              {l}
                            </button>
                          </td>
                        );
                      })}
                      <td className="py-1.5 text-center font-black">
                        {esCorr && <span className="text-green-400">✓</span>}
                        {esErr && <span className="text-red-400">✗</span>}
                        {!row.respuesta && <span className="text-slate-600">—</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          )}

          {/* SECCIÓN 2: Descriptores */}
          {descRows.length > 0 && (
          <div>
            <h4 className="text-xs text-purple-400 font-bold uppercase tracking-wider mb-2">Descriptores — marca el nivel alcanzado</h4>
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-600">
                  <th className="text-left py-2 pr-2 font-semibold w-6 text-slate-400">#</th>
                  <th className="text-left py-2 font-semibold text-slate-400 min-w-[100px]">Criterio</th>
                  {RUB2_LEVELS.map(nivel => (
                    <th key={nivel} className="text-center py-2 font-semibold w-[120px]">
                      <div className={`font-black text-xs ${nivel === 'AD' ? 'text-blue-400' : nivel === 'A' ? 'text-emerald-400' : nivel === 'B' ? 'text-amber-400' : 'text-red-400'}`} translate="no">{nivel}</div>
                      <div className="text-[9px] text-slate-500">{RUB2_LEVEL_LABELS[nivel]}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/40">
                {descRows.map((row, idx) => {
                  const i = rows.indexOf(row);
                  const configDesc = itemsConfig[i]?.descriptores?.length === 4 ? [...itemsConfig[i].descriptores] : row.descriptores;
                  return (
                    <tr key={i} className="hover:bg-slate-700/20">
                      <td className="py-1.5 pr-2 text-slate-400 font-bold">{idx + 1}</td>
                      <td className="py-1.5 text-white text-xs font-medium">{row.criterio || `Ítem ${i + 1}`}</td>
                      {RUB2_LEVELS.map((nivel, ni) => {
                        const selected = row.nivel === nivel;
                        const desc = configDesc[ni] || '';
                        return (
                          <td key={nivel} className="py-1.5 text-center">
                            <button onClick={() => marcarNivel(i, nivel)}
                              className={`w-full py-2 rounded-lg border-2 text-xs font-bold transition-all ${selected ? RUB2_CELL_COLORS[nivel] : 'bg-slate-700 border-slate-600 text-slate-400 hover:border-slate-400'}`} translate="no">
                              {nivel}
                            </button>
                            {desc && <div className="text-[9px] text-slate-400 leading-tight mt-0.5">{desc}</div>}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-slate-700 flex-shrink-0 space-y-3">
          <div className="flex items-center gap-4 bg-slate-700/50 rounded-xl p-3">
            <div className={`w-14 h-14 rounded-xl border-2 flex items-center justify-center text-2xl font-black ${CAL_BG[calFinal]}`} translate="no">{calFinal}</div>
            <div className="flex-1">
              <p className="text-white font-bold" translate="no">{CAL_LABEL[calFinal]}</p>
              <p className="text-slate-400 text-xs mt-0.5" translate="no">
                {altTotalConClave > 0 ? `Alt: ${altCorrectas}/${altTotalConClave} (${pctAlt}%) · ` : ''}Rúbrica: {resultado.rubAvg > 0 ? resultado.rubAvg.toFixed(1) : '—'}
                {resultado.hasAD ? ' · ⭐ AD' : ''}
              </p>
            </div>
            {resultado.calificativo === 'A' && (
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={esAD} onChange={e => setEsAD(e.target.checked)} className="w-4 h-4 rounded border-slate-500 text-purple-500" />
                <span className="text-xs text-purple-300 font-bold">AD global</span>
              </label>
            )}
          </div>
          <div className="flex gap-3">
            <button onClick={() => onGuardar({
              alumnoId: (alumno as any).id,
              columnaId: columna.id,
              marcados: rows.map(r => r.respuesta || ''),
              claves: rows.map(r => r.clave),
              calificativo: calFinal,
              esAD: calFinal === 'AD',
              fecha: new Date().toISOString().split('T')[0],
              items: rows.map(r => ({ criterio: r.criterio, clave: r.clave, respuesta: r.respuesta, nivel: r.nivel, descriptores: r.descriptores })),
            })}
              className="flex-1 py-2.5 bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 hover:opacity-90">
              <Save size={15}/> Guardar
            </button>
            <button onClick={onCerrar} className="px-5 py-2.5 bg-slate-700 text-white rounded-xl hover:bg-slate-600 text-sm">Cancelar</button>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Pop-up RÚBRICA con estructura C/B/A/AD
// ─────────────────────────────────────────────────────────────────────────────
function PopupRubrica({ alumno, columna, calActual, onGuardar, onCerrar }: {
  alumno: Alumno; columna: Columna; calActual?: Calificativo;
  onGuardar: (c: Calificativo) => void; onCerrar: () => void;
}) {
  const cols = (columna.columnasEval?.length ? columna.columnasEval : ['C', 'B', 'A', 'AD']) as string[];
  const items = Array.isArray(columna.itemsExamen) ? columna.itemsExamen : [];
  const initResp = (): string[] => {
    if (calActual?.items?.length) return calActual.items.map((it: any) => it.respuesta || '');
    return Array(items.length || columna.totalItems || cols.length).fill('');
  };
  const [respuestas, setRespuestas] = useState<string[]>(initResp);
  const [esAD, setEsAD] = useState(calActual?.esAD ?? false);

  const getCal = (): 'C'|'B'|'A'|'AD' => {
    const answered = respuestas.filter(r => r !== '');
    if (answered.length === 0) return 'C';
    const maxIdx = respuestas.reduce((max, r, i) => {
      const idx = cols.indexOf(r);
      return idx > max ? idx : max;
    }, -1);
    const base = cols[maxIdx] || 'C';
    if (esAD && base === 'A') return 'AD';
    return base as 'C'|'B'|'A'|'AD';
  };
  const cal = getCal();
  const nomAlumno = alumno.apellidos_nombres || alumno.nombre || '—';

  return (
    <>
    <div className="fixed inset-0 z-50 bg-black/70" onClick={onCerrar} />
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
      <div className="bg-slate-800 border border-indigo-500/30 rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col pointer-events-auto">
        <div className="px-6 py-4 border-b border-slate-700 flex-shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-white font-bold text-base" translate="no">{nomAlumno}</p>
              <p className="text-slate-300 text-xs">{(alumno as any).grado}° "{(alumno as any).seccion}"</p>
              <span className="text-xs text-green-400">📋 {columna.nombre}</span>
            </div>
            <button onClick={onCerrar} className="p-1.5 hover:bg-slate-700 rounded-lg text-slate-400"><X size={18}/></button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-3">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-slate-600">
                <th className="text-left py-2 text-slate-400">#</th>
                <th className="text-left py-2 text-slate-400">Indicador</th>
                {cols.map(c => <th key={c} className="text-center py-2 text-slate-300" translate="no">{c}</th>)}
              </tr>
            </thead>
            <tbody>
              {(items.length > 0 ? items : Array(columna.totalItems || cols.length).fill({ indicador: '' })).map((item: any, i: number) => (
                <tr key={i} className="border-b border-slate-700/50 hover:bg-slate-700/20">
                  <td className="py-2 text-slate-400 font-bold">{i + 1}</td>
                  <td className="py-2 text-white text-xs">{item.indicador || item.criterio || `Ítem ${i + 1}`}</td>
                  {cols.map(c => (
                    <td key={c} className="text-center py-2">
                      <button onClick={() => { const n = [...respuestas]; n[i] = n[i] === c ? '' : c; setRespuestas(n); }}
                        className={`w-10 h-10 rounded-lg font-bold text-sm transition-all border-2 ${respuestas[i] === c ? CAL_BG[c] + ' border-current shadow-lg' : 'bg-slate-700 border-slate-600 text-slate-400 hover:border-slate-400'}`} translate="no">
                        {c}
                      </button>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-4 border-t border-slate-700 flex gap-3">
          <div className={`w-16 h-16 rounded-xl border-2 flex items-center justify-center text-3xl font-black ${CAL_BG[cal]}`} translate="no">{cal}</div>
          <div className="flex-1">
            <p className="text-white font-bold" translate="no">{CAL_LABEL[cal]}</p>
            {cal === 'A' && (
              <label className="flex items-center gap-2 cursor-pointer mt-1">
                <input type="checkbox" checked={esAD} onChange={e => setEsAD(e.target.checked)} className="w-4 h-4 rounded border-slate-500 text-purple-500" />
                <span className="text-xs text-purple-300 font-bold">⭐ AD global</span>
              </label>
            )}
          </div>
          <button onClick={() => onGuardar({
            alumnoId: (alumno as any).id, columnaId: columna.id, marcados: respuestas, claves: [], calificativo: cal, esAD: cal === 'AD', fecha: new Date().toISOString().split('T')[0],
            items: respuestas.map((r, i) => ({ indicador: items[i]?.indicador || items[i]?.criterio || `Ítem ${i + 1}`, respuesta: r })),
          })}
            className="flex-1 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 hover:opacity-90">
            <Save size={15}/> Guardar
          </button>
          <button onClick={onCerrar} className="px-5 py-2.5 bg-slate-700 text-white rounded-xl hover:bg-slate-600 text-sm">Cancelar</button>
        </div>
      </div>
    </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Modal NUEVA / EDITAR columna
// ─────────────────────────────────────────────────────────────────────────────
function ModalColumna({ columnaEditar, onGuardar, onCerrar, userEmail, bimestres: bimestresProps }: {
  columnaEditar?: Columna; onGuardar: (c: Columna) => void; onCerrar: () => void; userEmail?: string; bimestres?: any[];
}) {
  const [nombre,    setNombre]    = useState('');
  const [tipo,      setTipo]      = useState<TipoInstrumento>('lista-cotejo');
  const [total,     setTotal]     = useState(10);
  const [compId,    setCompId]    = useState('comp1');
  const [bimestreId, setBimestreId] = useState('');
  const [promediar, setPromediar] = useState(true);
  const [correctas, setCorrectas] = useState<string[]>(Array(10).fill('A'));
  const [nuevasColumnasEval, setNuevasColumnasEval] = useState<string>('Sí,No');
  const [rub2Rows, setRub2Rows] = useState<ItemRubrica2Row[]>([]);
  const unidades = bimestresProps || [];

  // Resetear todo cuando cambia la columna a editar (evita que datos de un instrumento "contaminen" a otro)
  useEffect(() => {
    const t = columnaEditar?.tipo ?? 'lista-cotejo';
    const tot = columnaEditar?.totalItems ?? 10;
    const arr = Array.isArray(columnaEditar?.itemsExamen) ? columnaEditar.itemsExamen : [];
    setNombre(columnaEditar?.nombre ?? '');
    setTipo(t);
    setTotal(tot);
    setCompId(columnaEditar?.competenciaId ?? 'comp1');
    setBimestreId(columnaEditar?.bimestreId ?? '');
    setPromediar(columnaEditar?.promediar ?? true);
    setCorrectas(arr.length > 0 ? arr.map(i => i.correcta) : Array(tot).fill('A'));
    setNuevasColumnasEval(
      columnaEditar?.columnasEval ? columnaEditar.columnasEval.join(', ')
      : t === 'lista-cotejo' ? 'Sí,No'
      : t === 'ficha-observacion' ? 'Logrado,Parcial,No Logrado'
      : t === 'rubrica' ? 'C,B,A,AD'
      : t === 'rubrica-2' ? 'C,B,A,AD'
      : t === 'portafolio-evidencias' ? 'Presentó,No Presentó'
      : t === 'registro-anecdotico' ? 'Positivo,Negativo'
      : 'Siempre,Casi siempre,A veces,Rara vez,Nunca'
    );
    if (t === 'rubrica-2' && arr.length > 0) {
      setRub2Rows(arr.map(i => ({
        criterio: i.criterio || '',
        clave: i.correcta || '',
        tipo: (i.tipo as 'alternativa' | 'descriptor') || (i.correcta && i.correcta.trim() ? 'alternativa' : 'descriptor'),
        respuesta: '',
        nivel: '',
        descriptores: i.descriptores?.length === 4 ? [...(i.descriptores as string[])] : Array(4).fill(''),
      })));
    } else if (t === 'rubrica-2') {
      setRub2Rows(Array(tot).fill(null).map((_, i) => ({
        criterio: `Pregunta ${i + 1}`, clave: 'A', tipo: 'alternativa' as const, respuesta: '', nivel: '', descriptores: Array(4).fill('') as string[],
      })));
    }
  }, [columnaEditar?.id]);

  const ajustarTotal = (n: number) => {
    setTotal(n);
    setCorrectas(prev => n > prev.length ? [...prev, ...Array(n - prev.length).fill('A')] : prev.slice(0, n));
    setRub2Rows(prev => {
      if (n > prev.length) return [...prev, ...Array(n - prev.length).fill(null).map((_, i) => ({ criterio: `Pregunta ${prev.length + i + 1}`, clave: 'A', tipo: 'alternativa' as const, respuesta: '', nivel: '', descriptores: Array(4).fill('') as string[] }))];
      return prev.slice(0, n);
    });
  };

  const [error, setError] = useState('');

  const guardar = () => {
    if (!nombre.trim()) {
      setError('El nombre es obligatorio');
      return;
    }
    setError('');
    const itemsExamen = tipo === 'examen' ? correctas.map(c => ({ correcta: c }))
      : tipo === 'rubrica-2' ? rub2Rows.map(r => ({ correcta: r.clave || '', tipo: r.tipo, criterio: r.criterio, descriptores: r.tipo === 'descriptor' ? r.descriptores : undefined }))
      : undefined;
    const cols = nuevasColumnasEval.split(',').map(c => c.trim()).filter(c => c);
    onGuardar({ id: columnaEditar?.id ?? 'col-' + Date.now(), nombre: nombre.trim(), tipo, totalItems: total, competenciaId: compId, bimestreId: bimestreId || undefined, promediar, itemsExamen, columnasEval: cols.length > 0 ? cols : undefined, creatorId: userEmail || 'admin' });
  };

  const inp = "w-full bg-slate-700 border border-slate-600 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500 placeholder-slate-500";

  return (
    <>
    <div className="fixed inset-0 z-50 bg-black/70" onClick={onCerrar} />
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
      <div className="bg-slate-800 border border-indigo-500/30 rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col pointer-events-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700 flex-shrink-0">
          <h3 className="text-white font-bold text-lg">{columnaEditar ? '✏️ Editar columna' : '➕ Nueva columna'}</h3>
          <button onClick={onCerrar}><X size={18} className="text-slate-400"/></button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

          {/* Nombre */}
          <div>
            <label className="block text-xs text-slate-400 mb-1.5 font-medium uppercase tracking-wide">Nombre *</label>
            <input type="text" value={nombre} onChange={e => setNombre(e.target.value)}
              placeholder="Ej: Examen Bimestre 1, Rúbrica Exposición U2..."
              className={inp} autoFocus />
          </div>

          {/* Bimestre/Unidad */}
          <div>
            <label className="block text-xs text-slate-400 mb-1.5 font-medium uppercase tracking-wide">Unidad / Bimestre</label>
            <div className="flex gap-2">
              <button onClick={() => setBimestreId('')}
                className={`px-3 py-2 rounded-lg text-xs font-bold border-2 transition-all ${!bimestreId ? 'bg-slate-600 border-white text-white' : 'bg-slate-700 border-slate-600 text-slate-400 hover:border-slate-500'}`}>
                Todas las unidades
              </button>
              {unidades.map(b => (
                <button key={b.id} onClick={() => setBimestreId(b.id)}
                  className={`px-3 py-2 rounded-lg text-xs font-bold border-2 transition-all ${bimestreId === b.id ? 'bg-indigo-600 border-indigo-400 text-white' : 'bg-slate-700 border-slate-600 text-slate-400 hover:border-slate-500'}`}>
                  {b.nombre}
                </button>
              ))}
            </div>
          </div>

          {/* Competencia */}
          <div>
            <label className="block text-xs text-slate-400 mb-1.5 font-medium uppercase tracking-wide">Competencia</label>
            <div className="space-y-2">
              {COMPETENCIAS.map(c => (
                <button key={c.id} onClick={() => setCompId(c.id)}
                  className={`w-full text-left px-3 py-2.5 rounded-xl border-2 transition-all text-xs ${compId === c.id ? `bg-gradient-to-r ${c.color} text-white border-transparent font-bold shadow-lg` : 'bg-slate-700/60 text-slate-400 border-slate-600 hover:border-slate-500'}`}>
                  <span className="font-black mr-2 text-sm">{c.label}</span>{c.nombre}
                </button>
              ))}
            </div>
          </div>

          {/* ¿Se promedia? */}
          <div>
            <label className="block text-xs text-slate-400 mb-1.5 font-medium uppercase tracking-wide">¿Incluir en promedio de la competencia?</label>
            <div className="flex gap-2">
              <button onClick={() => setPromediar(true)}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold border-2 transition-all ${promediar ? 'bg-green-500/20 border-green-400 text-green-300' : 'bg-slate-700 border-slate-600 text-slate-400 hover:border-slate-500'}`}>
                ✅ Sí, incluir
              </button>
              <button onClick={() => setPromediar(false)}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold border-2 transition-all ${!promediar ? 'bg-slate-500/30 border-slate-400 text-slate-300' : 'bg-slate-700 border-slate-600 text-slate-400 hover:border-slate-500'}`}>
                ⊘ Solo registrar
              </button>
            </div>
          </div>

          {/* Tipo de instrumento */}
          <div>
            <label className="block text-xs text-slate-400 mb-1.5 font-medium uppercase tracking-wide">Tipo de instrumento</label>
            <div className="grid grid-cols-2 gap-2">
              {(Object.entries(TIPO_CONFIG) as [TipoInstrumento, typeof TIPO_CONFIG[TipoInstrumento]][]).map(([t, cfg]) => (
                <button key={t} onClick={() => setTipo(t)}
                  className={`py-3 rounded-xl text-xs font-bold border-2 transition-all flex flex-col items-center gap-1 ${tipo === t ? 'bg-indigo-600 border-indigo-400 text-white shadow-lg' : 'bg-slate-700 border-slate-600 text-slate-400 hover:bg-slate-600'}`}>
                  <span className="text-xl">{cfg.icono}</span>
                  <span>{cfg.label}</span>
                  {cfg.puedeAD && <span className="text-blue-300 text-xs">⭐ puede AD</span>}
                  {!cfg.puedeAD && <span className="text-slate-500 text-xs">máx: A</span>}
                </button>
              ))}
            </div>
          </div>

          {/* N° ítems */}
          <div>
            <label className="block text-xs text-slate-400 mb-1.5 font-medium uppercase tracking-wide">
              N° de {tipo === 'examen' ? 'preguntas' : 'indicadores/criterios'} *
            </label>
            <input type="number" min={1} max={50} value={total} onChange={e => ajustarTotal(Number(e.target.value))} className={inp} />
          </div>

          {/* Opciones de evaluación (para instrumentos no-examen) */}
          {tipo !== 'examen' && (
            <div>
              <label className="block text-xs text-slate-400 mb-1.5 font-medium uppercase tracking-wide">
                Opciones de evaluación (encabezados de columnas)
              </label>
              <p className="text-xs text-slate-500 mb-2">Separa las opciones con coma. Ej: Sí,No o Logrado,Parcial,No Logrado</p>
              <input 
                type="text" 
                value={nuevasColumnasEval}
                onChange={e => setNuevasColumnasEval(e.target.value)}
                placeholder="Sí,No"
                className={inp} 
              />
              <p className="text-xs text-indigo-400 mt-1">Las opciones se guardan al crear/editar el instrumento</p>
            </div>
          )}

          {/* Clave de respuestas (solo examen) */}
          {tipo === 'examen' && (
            <div>
              <label className="block text-xs text-slate-400 mb-2 font-medium uppercase tracking-wide">
                Clave de respuestas correctas
              </label>
              <p className="text-xs text-slate-500 mb-3">Selecciona la alternativa correcta para cada pregunta.</p>
              <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                {correctas.map((c, i) => (
                  <div key={i} className="flex items-center gap-3 bg-slate-700/50 rounded-xl px-3 py-2">
                    <span className="text-slate-300 text-xs font-bold w-10 flex-shrink-0">Preg. {i+1}</span>
                    <div className="flex gap-1.5">
                      {LETRAS.map(l => (
                        <button key={l} onClick={() => { const n = [...correctas]; n[i] = l; setCorrectas(n); }}
                          className={`w-8 h-8 rounded-lg text-xs font-bold transition-all border-2 ${c === l ? 'bg-green-500 border-green-400 text-white shadow shadow-green-500/30' : 'bg-slate-600 border-slate-500 text-slate-400 hover:bg-slate-500 hover:text-white'}`}>
                          {l}
                        </button>
                      ))}
                    </div>
                    <span className={`text-xs font-black ml-auto ${c ? 'text-green-400' : 'text-slate-600'}`}>{c || '?'}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Configuración de Rúbrica Mixta (rubrica-2) — dos secciones separadas */}
          {tipo === 'rubrica-2' && (
            <div className="space-y-5">
              {/* SECCIÓN ALTERNATIVAS */}
              <div>
                <label className="block text-xs text-amber-400 font-bold uppercase tracking-wider mb-1">
                  Alternativas (A/B/C/D)
                </label>
                <p className="text-xs text-slate-500 mb-2">Configura las preguntas con clave correcta. El alumno marca su alternativa y se compara con la clave.</p>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs border-collapse min-w-[500px]">
                    <thead className="sticky top-0 bg-slate-800 z-10">
                      <tr className="border-b border-slate-600">
                        <th className="text-left py-2 px-1 text-slate-400 w-6">#</th>
                        <th className="text-left py-2 px-1 text-slate-400 min-w-[140px]">Pregunta / Criterio</th>
                        <th className="text-center py-2 px-1 text-green-400 w-10">Clave</th>
                        <th className="text-center py-2 px-1 text-slate-400 w-8" colSpan={4}>Alternativas</th>
                        <th className="text-center py-2 px-1 w-6"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700/40">
                      {rub2Rows.filter(r => r.tipo === 'alternativa').map((row, idx) => {
                        const realIdx = rub2Rows.indexOf(row);
                        return (
                          <tr key={realIdx} className="hover:bg-amber-500/5">
                            <td className="py-1.5 px-1 text-amber-300 font-bold">{idx + 1}</td>
                            <td className="py-1.5 px-1">
                              <input type="text" value={row.criterio} onChange={e => { const n = [...rub2Rows]; n[realIdx] = { ...n[realIdx], criterio: e.target.value }; setRub2Rows(n); }}
                                className="w-full bg-slate-700 border border-amber-500/20 rounded px-2 py-1 text-white text-xs" placeholder={`Pregunta ${idx + 1}...`} />
                            </td>
                            <td className="py-1.5 px-1 text-center">
                              <span className={`inline-flex w-7 h-7 rounded-full font-black text-xs items-center justify-center ${row.clave ? 'bg-green-500/20 border border-green-500/50 text-green-300' : 'bg-slate-700 border border-slate-600 text-slate-500'}`} translate="no">{row.clave || '—'}</span>
                            </td>
                            <td className="py-1 px-0.5 text-center" colSpan={4}>
                              <div className="flex gap-1">
                                {['A','B','C','D'].map(l => (
                                  <button key={l} onClick={() => { const n = [...rub2Rows]; n[realIdx] = { ...n[realIdx], clave: l }; setRub2Rows(n); }}
                                    className={`w-8 h-8 rounded-lg font-bold text-xs transition-all border-2 ${row.clave === l ? 'bg-green-500 border-green-400 text-white shadow shadow-green-500/30' : 'bg-slate-700 border-slate-600 text-slate-400 hover:border-slate-400'}`} translate="no">
                                    {l}
                                  </button>
                                ))}
                              </div>
                            </td>
                            <td className="py-1.5 px-1 text-center">
                              <button onClick={() => { const n = [...rub2Rows]; n.splice(realIdx, 1); setRub2Rows(n); }} className="text-red-400 hover:text-red-300 text-xs">✕</button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <button onClick={() => setRub2Rows(prev => [...prev, { criterio: `Pregunta ${prev.filter(r => r.tipo === 'alternativa').length + 1}`, clave: 'A', tipo: 'alternativa' as const, respuesta: '', nivel: '', descriptores: Array(4).fill('') as string[] }])}
                  className="text-xs text-amber-400 hover:underline mt-1 block">+ Agregar alternativa</button>
              </div>

              {/* SECCIÓN DESCRIPTORES */}
              <div>
                <label className="block text-xs text-purple-400 font-bold uppercase tracking-wider mb-1">
                  Descriptores (INICIO / PROCESO / LOGRO / LOGRO DESTACADO)
                </label>
                <p className="text-xs text-slate-500 mb-2">Configura los criterios donde el docente marca el nivel alcanzado y define los descriptores por nivel.</p>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs border-collapse min-w-[600px]">
                    <thead className="sticky top-0 bg-slate-800 z-10">
                      <tr className="border-b border-slate-600">
                        <th className="text-left py-2 px-1 text-slate-400 w-6">#</th>
                        <th className="text-left py-2 px-1 text-slate-400 min-w-[120px]">Criterio</th>
                        {RUB2_LEVELS.map(nivel => (
                          <th key={nivel} className="text-center py-2 px-1 min-w-[100px]">
                            <div className={`font-black text-xs ${nivel === 'AD' ? 'text-blue-400' : nivel === 'A' ? 'text-emerald-400' : nivel === 'B' ? 'text-amber-400' : 'text-red-400'}`} translate="no">{nivel}</div>
                            <div className="text-[9px] text-slate-500">{RUB2_LEVEL_LABELS[nivel]}</div>
                          </th>
                        ))}
                        <th className="text-center py-2 px-1 w-6"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700/40">
                      {rub2Rows.filter(r => r.tipo === 'descriptor').map((row, idx) => {
                        const realIdx = rub2Rows.indexOf(row);
                        return (
                          <tr key={realIdx} className="hover:bg-purple-500/5">
                            <td className="py-1.5 px-1 text-purple-300 font-bold">{idx + 1}</td>
                            <td className="py-1.5 px-1">
                              <input type="text" value={row.criterio} onChange={e => { const n = [...rub2Rows]; n[realIdx] = { ...n[realIdx], criterio: e.target.value }; setRub2Rows(n); }}
                                className="w-full bg-slate-700 border border-purple-500/20 rounded px-2 py-1 text-white text-xs" placeholder={`Criterio ${idx + 1}...`} />
                            </td>
                            {RUB2_LEVELS.map((nivel, ni) => (
                              <td key={nivel} className="py-1.5 px-1">
                                <input type="text" value={row.descriptores[ni] || ''} onChange={e => { const n = [...rub2Rows]; const d = [...n[realIdx].descriptores]; d[ni] = e.target.value; n[realIdx] = { ...n[realIdx], descriptores: d }; setRub2Rows(n); }}
                                  className={`w-full bg-slate-700/50 border rounded px-1.5 py-1 text-[10px] text-slate-300 placeholder-slate-500 ${nivel === 'AD' ? 'border-blue-500/30' : nivel === 'A' ? 'border-emerald-500/30' : nivel === 'B' ? 'border-amber-500/30' : 'border-red-500/30'}`}
                                  placeholder={RUB2_LEVEL_LABELS[nivel]} />
                              </td>
                            ))}
                            <td className="py-1.5 px-1 text-center">
                              <button onClick={() => { const n = [...rub2Rows]; n.splice(realIdx, 1); setRub2Rows(n); }} className="text-red-400 hover:text-red-300 text-xs">✕</button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <button onClick={() => setRub2Rows(prev => [...prev, { criterio: `Criterio ${prev.filter(r => r.tipo === 'descriptor').length + 1}`, clave: '', tipo: 'descriptor' as const, respuesta: '', nivel: '', descriptores: Array(4).fill('') as string[] }])}
                  className="text-xs text-purple-400 hover:underline mt-1 block">+ Agregar descriptor</button>
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="px-6 py-2 bg-red-500/10 border-t border-red-500/30">
            <p className="text-red-300 text-xs font-bold">{error}</p>
          </div>
        )}
        <div className="flex gap-2 px-6 py-4 border-t border-slate-700 flex-shrink-0">
          <button onClick={guardar}
            className="flex-1 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold rounded-xl text-sm hover:opacity-90">
            {columnaEditar ? 'Guardar cambios' : 'Crear columna'}
          </button>
          <button onClick={onCerrar}
            className="px-5 py-2.5 bg-slate-700 text-white rounded-xl hover:bg-slate-600 text-sm">
            Cancelar
</button>
        </div>
      </div>
    </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Modal PLANILLA / VISTA EXCEL — registro masivo por columna
// ─────────────────────────────────────────────────────────────────────────────
interface PlanillaFila {
  alumnoId: string;
  nombre: string;
  grado: string;
  seccion: string;
  respuestas: string[];
  calificativo: 'C' | 'B' | 'A' | 'AD';
  esAD: boolean;
  notaNumerica?: number;
}

function ModalPlanilla({ columna, alumnos, calificativos, onGuardarTodo, onCerrar }: {
  columna: Columna; alumnos: Alumno[]; calificativos: Calificativo[];
  onGuardarTodo: (cals: Calificativo[], idsEliminar?: string[]) => void; onCerrar: () => void;
}) {
  const totalItems = columna.totalItems || 1;
  const tipo = columna.tipo;
  const itemsExamenArr = Array.isArray(columna.itemsExamen) ? columna.itemsExamen : [];
  const columnasEval = Array.isArray(columna.columnasEval) && columna.columnasEval.length > 0
    ? columna.columnasEval
    : (tipo === 'lista-cotejo' ? ['Sí','No']
      : tipo === 'ficha-observacion' ? ['Logrado','Parcial','No Logrado']
      : tipo === 'portafolio-evidencias' ? ['Presentó','No Presentó']
      : tipo === 'registro-anecdotico' ? ['Positivo','Negativo']
      : tipo === 'escala-valoracion' ? ['Siempre','Casi siempre','A veces','Rara vez','Nunca']
      : ['Sí','No']);

  const rubricaLabels = ['C','B','A','AD'];
  const letrasExamen = ['A','B','C','D','E'];

  const getCal = (alumnoId: string) => calificativos.find(c => c.alumnoId === alumnoId && c.columnaId === columna.id);

  const inicialFilas = (): PlanillaFila[] => alumnos.map(a => {
    const cal = getCal((a as any).id);
    let respuestas: string[] = Array(totalItems).fill('');
    if (tipo === 'examen') {
      respuestas = cal?.claves ? [...cal.claves] : Array(totalItems).fill('');
    } else if (tipo === 'rubrica') {
      const prev = (cal?.marcados || []) as any;
      respuestas = Array.isArray(prev) && prev.length > 0
        ? prev.map((r: any) => (typeof r === 'string' ? r : ''))
        : Array(totalItems).fill('');
    } else if (tipo === 'nota-numerica') {
      respuestas = [cal?.notaNumerica !== undefined ? String(cal.notaNumerica) : ''];
    } else {
      const prev = (cal?.marcados || []) as any;
      respuestas = Array.isArray(prev) && prev.length > 0
        ? prev.map((r: any) => (typeof r === 'string' ? r : ''))
        : Array(totalItems).fill('');
    }
    return {
      alumnoId: (a as any).id,
      nombre: a.apellidos_nombres || a.nombre || '—',
      grado: (a as any).grado || '',
      seccion: (a as any).seccion || '',
      respuestas,
      calificativo: (cal?.calificativo as any) || 'C',
      esAD: cal?.esAD || false,
      notaNumerica: cal?.notaNumerica,
    };
  });

  const [filas, setFilas] = useState<PlanillaFila[]>(inicialFilas);
  const [guardando, setGuardando] = useState(false);

  const calcularCalExamen = (respuestas: string[]) => {
    let correctas = 0;
    respuestas.forEach((r, i) => {
      if (r && r === itemsExamenArr[i]?.correcta) correctas++;
    });
    const pct = totalItems > 0 ? Math.round((correctas / totalItems) * 100) : 0;
    return calcularEscala('examen', pct);
  };

  const calcularCalRubrica = (respuestas: string[]) => {
    let suma = 0, count = 0;
    respuestas.forEach(r => {
      const val = { C: 1, B: 2, A: 3, AD: 4 }[r] || 0;
      if (val) { suma += val; count++; }
    });
    if (count === 0) return 'C';
    const prom = Math.round(suma / count);
    const map: Record<number, string> = { 1: 'C', 2: 'B', 3: 'A', 4: 'AD' };
    return (map[Math.min(4, Math.max(1, prom))] || 'C') as 'C'|'B'|'A'|'AD';
  };

  const calcularCalNota = (nota: number) => {
    if (nota >= 18) return 'A';
    if (nota >= 14) return 'B';
    return 'C';
  };

  const calcularCalOtros = (respuestas: string[]) => {
    let positivos = 0;
    respuestas.forEach(r => {
      if (['Sí','Logrado','Presentó','Siempre','Casi siempre'].includes(r)) positivos++;
    });
    const pct = totalItems > 0 ? Math.round((positivos / totalItems) * 100) : 0;
    return calcularEscala(columna.tipo, pct);
  };

  const actualizarRespuesta = (idx: number, itemIdx: number, valor: string) => {
    setFilas(prev => {
      const n = [...prev];
      const fila = { ...n[idx] };
      const nuevasResp = [...fila.respuestas];
      nuevasResp[itemIdx] = nuevasResp[itemIdx] === valor ? '' : valor;
      fila.respuestas = nuevasResp;

      if (tipo === 'examen') {
        fila.calificativo = calcularCalExamen(nuevasResp);
        fila.esAD = false;
      } else if (tipo === 'rubrica') {
        const auto = calcularCalRubrica(nuevasResp);
        fila.calificativo = fila.esAD && auto === 'A' ? 'AD' : auto;
} else if (tipo === 'rubrica-2') {
        const cal = getCal(fila.alumnoId);
        const rows: ItemRubrica2Row[] = nuevasResp.map((resp, i) => ({
          criterio: (cal?.items as any[])?.[i]?.criterio || '',
          clave: cal?.claves?.[i] || (cal?.items as any[])?.[i]?.clave || itemsExamenArr[i]?.correcta || '',
          tipo: (itemsExamenArr[i]?.tipo as 'alternativa' | 'descriptor') || (itemsExamenArr[i]?.correcta ? 'alternativa' : 'descriptor'),
          respuesta: resp,
          nivel: (cal?.items as any[])?.[i]?.nivel || '',
          descriptores: itemsExamenArr[i]?.descriptores?.length === 4 ? [...(itemsExamenArr[i].descriptores as string[])] : Array(4).fill('') as string[],
        }));
        const res2 = calcularCalRubrica2(rows);
        fila.calificativo = res2.calificativo;
        fila.esAD = res2.calificativo === 'AD';
      } else if (tipo === 'nota-numerica') {
        const nota = Math.max(0, Math.min(20, Number(nuevasResp[0] || 0)));
        fila.notaNumerica = nota;
        fila.calificativo = calcularCalNota(nota);
        fila.esAD = false;
      } else {
        fila.calificativo = calcularCalOtros(nuevasResp);
        fila.esAD = false;
      }
      n[idx] = fila;
      return n;
    });
  };

  const toggleAD = (idx: number) => {
    if (tipo !== 'rubrica' && tipo !== 'rubrica-2') return;
    setFilas(prev => {
      const n = [...prev];
      const fila = { ...n[idx] };
      if (tipo === 'rubrica') {
        const auto = calcularCalRubrica(fila.respuestas);
        fila.esAD = !fila.esAD;
        fila.calificativo = fila.esAD && auto === 'A' ? 'AD' : auto;
} else if (tipo === 'rubrica-2') {
        const cal = getCal(fila.alumnoId);
        const rows: ItemRubrica2Row[] = fila.respuestas.map((resp, i) => ({
          criterio: (cal?.items as any[])?.[i]?.criterio || '',
          clave: cal?.claves?.[i] || (cal?.items as any[])?.[i]?.clave || itemsExamenArr[i]?.correcta || '',
          tipo: (itemsExamenArr[i]?.tipo as 'alternativa' | 'descriptor') || (itemsExamenArr[i]?.correcta ? 'alternativa' : 'descriptor'),
          respuesta: resp,
          nivel: (cal?.items as any[])?.[i]?.nivel || '',
          descriptores: itemsExamenArr[i]?.descriptores?.length === 4 ? [...(itemsExamenArr[i].descriptores as string[])] : Array(4).fill('') as string[],
        }));
        const res2 = calcularCalRubrica2(rows);
        fila.esAD = !fila.esAD;
        if (fila.esAD && res2.calificativo === 'A') {
          fila.calificativo = 'AD';
        } else {
          fila.calificativo = res2.calificativo;
        }
      }
      n[idx] = fila;
      return n;
    });
  };

  const guardar = async () => {
    setGuardando(true);

    // Solo enviar filas que tienen datos reales (al menos una respuesta o nota)
    const tieneDatos = (f: PlanillaFila) => {
      if (tipo === 'nota-numerica') return f.notaNumerica !== undefined && f.notaNumerica > 0;
      return f.respuestas.some(r => r && r.trim() !== '');
    };

    const cals: Calificativo[] = filas.filter(tieneDatos).map(f => {
      const base: Calificativo = {
        alumnoId: f.alumnoId,
        columnaId: columna.id,
        marcados: [],
        calificativo: f.calificativo,
        esAD: f.esAD,
        fecha: new Date().toISOString().split('T')[0],
      };
      if (tipo === 'examen') {
        base.claves = f.respuestas;
      } else if (tipo === 'nota-numerica') {
        base.notaNumerica = f.notaNumerica ?? 0;
      } else {
        base.marcados = f.respuestas as any;
      }
      return base;
    });

    // Identificar alumnos que tenían calificación previa pero ahora no tienen datos
    const idsPrevios = new Set(calificativos.filter(c => c.columnaId === columna.id).map(c => c.alumnoId));
    const idsConDatos = new Set(cals.map(c => c.alumnoId));
    const idsAEliminar = Array.from(idsPrevios).filter(id => !idsConDatos.has(id));

    onGuardarTodo(cals, idsAEliminar);
    setGuardando(false);
  };

  const exportarExcel = () => {
    const headers = ['#', 'Alumno', 'Grado', 'Sección'];
    if (tipo === 'nota-numerica') {
      headers.push('Nota');
    } else {
      for (let i = 1; i <= totalItems; i++) headers.push(`Item ${i}`);
    }
    headers.push('Calificación');

    const data: any[][] = [headers];
    filas.forEach((f, i) => {
      const row: any[] = [i + 1, f.nombre, f.grado, f.seccion];
      if (tipo === 'nota-numerica') {
        row.push(f.notaNumerica ?? '');
      } else {
        f.respuestas.forEach(r => row.push(r));
      }
      row.push(f.calificativo);
      data.push(row);
    });

    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, columna.nombre);
    XLSX.writeFile(wb, `planilla_${columna.nombre.replace(/\s+/g,'_')}_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const inp = "w-full bg-slate-700 border border-slate-600 rounded px-2 py-1 text-white text-xs focus:outline-none focus:border-indigo-500";

  return (
    <>
    <div className="fixed inset-0 z-50 bg-black/70" onClick={onCerrar} />
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
      <div className="bg-slate-800 border border-emerald-500/30 rounded-2xl w-full max-w-[95vw] max-h-[92vh] flex flex-col pointer-events-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700 flex-shrink-0">
          <div>
            <h3 className="text-white font-bold text-lg">📋 Planilla: {columna.nombre}</h3>
            <p className="text-slate-400 text-xs">{TIPO_CONFIG[tipo]?.label} · {totalItems} {tipo==='examen'?'preguntas':'ítems'} · {alumnos.length} alumnos</p>
          </div>
          <button onClick={onCerrar}><X size={18} className="text-slate-400"/></button>
        </div>

        <div className="flex-1 overflow-auto px-6 py-4">
          <table className="w-full text-xs border-collapse">
            <thead className="sticky top-0 bg-slate-800 z-10">
              <tr className="border-b border-slate-600">
                <th className="text-left py-2 px-2 text-slate-400 w-8">#</th>
                <th className="text-left py-2 px-2 text-slate-400 min-w-[180px]">Alumno</th>
                {tipo === 'nota-numerica' ? (
                  <th className="text-center py-2 px-2 text-slate-400 w-24">Nota (0-20)</th>
                ) : (
                  Array.from({ length: totalItems }, (_, i) => (
                    <th key={i} className="text-center py-2 px-1 text-slate-400 w-16">{tipo==='examen'?`P${i+1}`:`I${i+1}`}</th>
                  ))
                )}
                <th className="text-center py-2 px-2 text-slate-400 w-20">Calif.</th>
                {tipo === 'rubrica' && <th className="text-center py-2 px-2 text-slate-400 w-16">AD</th>}
                {tipo === 'rubrica-2' && <th className="text-center py-2 px-2 text-slate-400 w-16">AD</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/40">
              {filas.map((fila, idx) => (
                <tr key={fila.alumnoId} className={`hover:bg-slate-700/20 ${idx%2===0?'bg-slate-800/20':'bg-slate-800/40'}`}>
                  <td className="py-2 px-2 text-slate-500">{idx+1}</td>
                  <td className="py-2 px-2 text-white font-medium">{fila.nombre}</td>
                  {tipo === 'nota-numerica' ? (
                    <td className="py-2 px-1 text-center">
                      <input type="number" min={0} max={20} value={fila.notaNumerica ?? ''}
                        onChange={e => actualizarRespuesta(idx, 0, e.target.value)}
                        className={`${inp} w-16 text-center`} />
                    </td>
                  ) : (
                    fila.respuestas.map((resp, i) => (
                      <td key={i} className="py-1 px-1 text-center">
                        {tipo === 'examen' ? (
                          <select value={resp} onChange={e => actualizarRespuesta(idx, i, e.target.value)} className={`${inp} w-14 text-center`}>
                            <option value=""></option>
                            {letrasExamen.map(l => <option key={l} value={l}>{l}</option>)}
                          </select>
                        ) : tipo === 'rubrica' || tipo === 'rubrica-2' ? (
                          <select value={resp} onChange={e => actualizarRespuesta(idx, i, e.target.value)} className={`${inp} w-14 text-center`}>
                            <option value=""></option>
                            {rubricaLabels.map(l => <option key={l} value={l}>{l}</option>)}
                          </select>
                        ) : (
                          <select value={resp} onChange={e => actualizarRespuesta(idx, i, e.target.value)} className={`${inp} w-20 text-center`}>
                            <option value=""></option>
                            {columnasEval.map((opt: string) => <option key={opt} value={opt}>{opt}</option>)}
                          </select>
                        )}
                      </td>
                    ))
                  )}
                  <td className="py-2 px-2 text-center">
                    <span className={`inline-block px-2 py-1 rounded font-bold text-xs ${CAL_BG[fila.calificativo]}`} translate="no">
                      {fila.calificativo}
                    </span>
                  </td>
                  {tipo === 'rubrica' && (
                    <td className="py-2 px-2 text-center">
                      <button onClick={() => toggleAD(idx)}
                        className={`text-xs font-bold px-2 py-1 rounded border-2 ${fila.esAD ? 'bg-blue-500/30 border-blue-400 text-blue-200' : 'bg-slate-700 border-slate-600 text-slate-400'}`}>
                        ⭐
                      </button>
                    </td>
                  )}
                  {tipo === 'rubrica-2' && (
                    <td className="py-2 px-2 text-center">
                      <button onClick={() => toggleAD(idx)}
                        className={`text-xs font-bold px-2 py-1 rounded border-2 ${fila.esAD ? 'bg-blue-500/30 border-blue-400 text-blue-200' : 'bg-slate-700 border-slate-600 text-slate-400'}`}>
                        ⭐
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex gap-3 px-6 py-4 border-t border-slate-700 flex-shrink-0">
          <button onClick={guardar} disabled={guardando}
            className={`flex-1 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold rounded-xl text-sm hover:opacity-90 ${guardando?'opacity-50 cursor-not-allowed':''}`}>
            {guardando ? 'Guardando...' : '💾 Guardar todo'}
          </button>
          <button onClick={exportarExcel}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-bold">
            <FileSpreadsheet size={15}/> Exportar Excel
          </button>
          <button onClick={onCerrar} className="px-5 py-2.5 bg-slate-700 text-white rounded-xl hover:bg-slate-600 text-sm">Cerrar</button>
        </div>
      </div>
    </div>
    </>
  );
}
// ─────────────────────────────────────────────────────────────────────────────
// Celda de promedio
function CeldaPromedio({ prom, promBg }: { prom: 'C'|'B'|'A'|'AD'|null; promBg: string }) {
  if (!prom) return (
    <td className="px-2 py-2 text-center border-r border-slate-600/50">
      <div className="min-h-[40px] rounded-xl border-2 border-dashed border-slate-600/40 flex items-center justify-center text-slate-600 text-xs">—</div>
    </td>
  );
  return (
    <td className="px-2 py-2 text-center border-r border-slate-600/50">
      <div className={`min-h-[40px] rounded-xl border-2 flex items-center justify-center font-black text-base ${promBg}`}>{prom}</div>
      <p className="text-xs mt-0.5 text-slate-500">{CAL_LABEL[prom]?.split(' ')[0]}</p>
    </td>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Pantalla principal
// ─────────────────────────────────────────────────────────────────────────────
interface UserProp { id?: string; role?: string; email?: string; name?: string; }

export default function CalificativosScreen({ user }: { user?: UserProp }) {
  const [alumnos,       setAlumnos]       = useState<Alumno[]>([]);
  const [columnas,      setColumnas]      = useState<Columna[]>([]);
  const [calificativos, setCalificativos] = useState<Calificativo[]>([]);
  const [bimestres,    setBimestres]    = useState<any[]>([]);
  const [filtroUnidad, setFiltroUnidad] = useState<string>('');
  const [filtroCreador, setFiltroCreador] = useState<string>('');
  const [filtroGrado,   setFiltroGrado]   = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [filtroSeccion, setFiltroSeccion] = useState('');
  const [popup,         setPopup]         = useState<{ alumno: Alumno; columna: Columna } | null>(null);
  const [modalColumna,  setModalColumna]  = useState<{ columna?: Columna } | null>(null);
  const modalColumnaRef = useRef(modalColumna);
  useEffect(() => { modalColumnaRef.current = modalColumna; }, [modalColumna]);
  const [planillaColumna, setPlanillaColumna] = useState<Columna | null>(null);
  const [showGestion,   setShowGestion]   = useState(false);
  const [compExpand,    setCompExpand]    = useState<Record<string, boolean>>({ comp1: true, comp2: true, comp3: true });
  const [syncing,       setSyncing]       = useState(false);
  const [syncMsg,       setSyncMsg]       = useState<{tipo:'ok'|'err';texto:string}|null>(null);
  const [asignacionDocente, setAsignacionDocente] = useState<{grados:string[]; secciones:string[]; cursos:string[]} | null>(null);
  const [ultimaSync,    setUltimaSync]    = useState<Date | null>(null);
  const [cambiosRemotos, setCambiosRemotos] = useState(0);
  const [showRespaldo,  setShowRespaldo]  = useState(false);
  const [calProgreso,   setCalProgreso]   = useState<{ loaded: number; total: number } | null>(null);

  // Helper: parsear asignaciones (grados/secciones/cursos pueden venir como JSON string desde Turso)
  const parsearAsignaciones = (asigs: any[]): any[] =>
    asigs.map((a: any) => ({
      ...a,
      grados:    typeof a.grados    === 'string' ? JSON.parse(a.grados    || '[]') : (a.grados    || []),
      secciones: typeof a.secciones === 'string' ? JSON.parse(a.secciones || '[]') : (a.secciones || []),
      cursos:    typeof a.cursos    === 'string' ? JSON.parse(a.cursos    || '[]') : (a.cursos    || []),
    }));

  // Helper: normalizar grado para comparación ('1' y '1°' son equivalentes)
  const normGrado = (g: string) => String(g || '').trim().replace(/°$/, '');

  // Helper: normalizar sección para comparación
  const normSeccion = (s: string) => String(s || '').trim().replace(/^\d+/, '').toUpperCase();

  // Helper: aplicar asignaciones al estado del docente
  const aplicarAsignacion = (asigs: any[]) => {
    if (!user?.role || user.role !== 'teacher') return;
    const docenteId = (user as any).docenteId;
    const userId    = (user as any).id;
    const userEmail = (user as any).email;

    console.log('[EduGest] Buscando asignación para docente:', { docenteId, userId, userEmail });
    console.log('[EduGest] Total asignaciones disponibles:', asigs.length);
    if (asigs.length > 0) {
      console.log('[EduGest] Primeras 3 asignaciones:', asigs.slice(0, 3).map(a => ({ id: a.id, docenteId: a.docenteId, grados: a.grados, secciones: a.secciones })));
    }

    // Buscar asignaciones por docenteId o, como fallback, por userId
    const parsed = parsearAsignaciones(asigs);
    let mias = parsed.filter((a: any) =>
      (docenteId && a.docenteId === docenteId) ||
      (userId    && a.docenteId === userId)
    );

    // Fallback 2: si no encontramos, buscar por email del usuario
    if (mias.length === 0 && userEmail) {
      mias = parsed.filter((a: any) =>
        a.docenteId === userEmail || a.docenteId?.includes(userEmail)
      );
    }

// ─────────────────────────────────────────────────────────────────────────────

    // Fallback 3: buscar por nombre del docente en la lista de docentes
    if (mias.length === 0) {
      try {
        const docentes = JSON.parse(localStorage.getItem('ie_docentes') || '[]');
        const miDocente = docentes.find((d: any) =>
          d.id === docenteId || d.id === userId
        );
        if (miDocente?.apellidos_nombres) {
          mias = parsed.filter((a: any) => {
            const docAsig = docentes.find((d: any) => d.id === a.docenteId);
            return docAsig?.apellidos_nombres === miDocente.apellidos_nombres;
          });
        }
      } catch { /* silencioso */ }
    }

    console.log('[EduGest] Asignaciones encontradas:', mias.length);

    if (mias.length === 0) {
      console.warn('[EduGest] No se encontró asignación para este docente');
      // Si no hay asignación, mostrar TODOS los alumnos (no vacío)
      setAsignacionDocente(null);
      return;
    }

    const grados   = [...new Set(mias.flatMap((a: any) => a.grados))] as string[];
    const secciones = [...new Set(mias.flatMap((a: any) => a.secciones))] as string[];
    const cursos   = [...new Set(mias.flatMap((a: any) => a.cursos || []))] as string[];

    console.log('[EduGest] Grados asignados:', grados);
    console.log('[EduGest] Secciones asignadas:', secciones);

    if (grados.length > 0 || secciones.length > 0) {
      setAsignacionDocente({ grados, secciones, cursos });
    } else {
      setAsignacionDocente(null);
    }
  };

  const cargar = async () => {
    setSyncing(true);
    try {
      // Helper para parsear localStorage
      const _parseArr = (key: string) => { try { const d = JSON.parse(localStorage.getItem(key) || '[]'); return Array.isArray(d) ? d : []; } catch { return []; } };

      // 1) MOSTRAR INMEDIATAMENTE desde localStorage (igual que DocentesScreen/NormasConvivencia)
      const localAlumnos = _parseArr('ie_alumnos');
      const localColumnas = _parseArr('cal_columnas');
      const localUnidades = _parseArr('cfg_unidades');
      const localAsigs = _parseArr('cfg_asignaciones');
      const localCals = _parseArr('ie_calificativos_v2');

      if (localAlumnos.length > 0) setAlumnos(localAlumnos);
      if (localColumnas.length > 0) setColumnas(localColumnas);
      if (localUnidades.length > 0) setBimestres(localUnidades.filter((u: any) => u.activa !== false));
      if (localCals.length > 0) setCalificativos(localCals);
      if (localAsigs.length > 0) aplicarAsignacion(localAsigs);

      // 2) EN SEGUNDO PLANO: intentar descargar desde Turso/API
      let asignacionesCargadas: any[] = localAsigs;
      try {
        // Paso 2a: datos ligeros primero (asignaciones, columnas, unidades)
        const ligero = await cargarTodo('columnas,unidades,asignaciones');
if (ligero.columnas?.length > 0) {
            setColumnas(prev => {
              if (modalColumnaRef.current) return prev;
              const merged = ligero.columnas.map((sc: any) => {
                const local = prev.find((lc: any) => lc.id === sc.id);
                if (local && (local.itemsExamen?.length || 0) > (sc.itemsExamen?.length || 0)) {
                  return { ...sc, itemsExamen: local.itemsExamen, columnasEval: local.columnasEval || sc.columnasEval };
                }
                return sc;
              });
              const localOnly = prev.filter((lc: any) => !ligero.columnas.some((sc: any) => sc.id === lc.id));
              return [...merged, ...localOnly];
            });
            localStorage.setItem('cal_columnas', JSON.stringify(ligero.columnas));
        }
        if (ligero.unidades?.length > 0) {
          setBimestres((ligero.unidades || []).filter((u: any) => u.activa !== false));
          localStorage.setItem('cfg_unidades', JSON.stringify(ligero.unidades));
        }
        if (ligero.asignaciones?.length > 0) {
          localStorage.setItem('cfg_asignaciones', JSON.stringify(ligero.asignaciones));
          asignacionesCargadas = ligero.asignaciones;
          aplicarAsignacion(asignacionesCargadas);
        }
        // Paso 2b: alumnos por separado (tabla grande)
        const todoAlumnos = await cargarTodo('alumnos');
        if (todoAlumnos.alumnos?.length > 0) {
          setAlumnos(todoAlumnos.alumnos);
          localStorage.setItem('ie_alumnos', JSON.stringify(todoAlumnos.alumnos));
        }
        // Calificaciones — caché de 10 min → paginado 500 por página
        const cachedCal = getCacheCalificaciones();
        if (cachedCal) {
          setCalificativos(cachedCal);
        } else {
          try {
            const PAGE = 500;
            let page = 0;
            let acumulado: any[] = [];
            let total = 0;

            while (true) {
              const result = await cargarCalPaginado(page, PAGE);
              if (page === 0 && result.total !== undefined) {
                total = result.total;
                setCalProgreso({ loaded: 0, total });
              }
              acumulado = [...acumulado, ...result.calificaciones];
              // Mostrar lo que hay hasta ahora (carga progresiva)
              setCalificativos([...acumulado]);
              setCalProgreso({ loaded: acumulado.length, total: total || acumulado.length });

              if (result.calificaciones.length < PAGE) break; // última página
              page++;
            }

            setCacheCalificaciones(acumulado);
            localStorage.setItem('ie_calificativos_v2', JSON.stringify(acumulado));
          } catch { /* si falla Turso ya tenemos localStorage */ }
          setCalProgreso(null);
        }
      } catch (e) {
        console.warn('[EduGest] Error cargando de Turso:', e);
      }

      // 3) Si aún no hay datos de ningún lado, mostrar mensaje
      if (localAlumnos.length === 0 && alumnos.length === 0) {
        // No forzar mensaje de error, dejar que la UI muestre "Sin alumnos"
      }

    } catch (err: any) {
      setSyncMsg({ tipo: 'err', texto: `❌ Error al cargar: ${err.message}` });
      setTimeout(() => setSyncMsg(null), 4000);
    } finally {
      setSyncing(false);
      setUltimaSync(new Date());
    }
  };

  // cargarAsignacion: reutiliza localStorage (ya actualizado por cargar())
  // Se mantiene para que sincronizarDesdeTurso() también pueda llamarla
  const cargarAsignacion = async () => {
    if (!user?.role || user.role !== 'teacher') return;
    try {
      const localAsigs = JSON.parse(localStorage.getItem('cfg_asignaciones') || '[]');
      if (localAsigs.length > 0) {
        aplicarAsignacion(localAsigs);
        return;
      }
      // Si no hay en localStorage, consultar Turso directamente
      const todo = await cargarTodo('asignaciones');
      if (todo.asignaciones?.length > 0) {
        localStorage.setItem('cfg_asignaciones', JSON.stringify(todo.asignaciones));
        aplicarAsignacion(todo.asignaciones);
      }
    } catch (_) {}
  };

  // Firebase primero: si hay datos en la nube, úsalos inmediatamente
  useEffect(() => {
    (async () => {
      try {
        const { getAlumnosFB, getColumnasFB, getUnidadesFB, getAsignacionesFB, getCalificativosFB } = await import('../services/firebaseDataService');
        const [a, c, u, s, cal] = await Promise.all([
          getAlumnosFB(), getColumnasFB(), getUnidadesFB(), getAsignacionesFB(), getCalificativosFB()
        ]);
        if (a.length) { setAlumnos(a); localStorage.setItem('ie_alumnos', JSON.stringify(a)); }
        if (c.length) { setColumnas(prev => {
          if (modalColumnaRef.current) return prev;
          if (!prev.length) return c;
          const merged = c.map((sc: any) => {
            const local = prev.find((lc: any) => lc.id === sc.id);
            if (local && (local.itemsExamen?.length || 0) > (sc.itemsExamen?.length || 0)) {
              return { ...sc, itemsExamen: local.itemsExamen, columnasEval: local.columnasEval || sc.columnasEval };
            }
            return sc;
          });
          const localOnly = prev.filter((lc: any) => !c.some((sc: any) => sc.id === lc.id));
          return [...merged, ...localOnly];
        }); localStorage.setItem('cal_columnas', JSON.stringify(c)); }
        if (u.length) { setBimestres(u.filter((x: any) => x.activa !== false)); localStorage.setItem('cfg_unidades', JSON.stringify(u)); }
        if (s.length) { localStorage.setItem('cfg_asignaciones', JSON.stringify(s)); aplicarAsignacion(s); }
        if (cal.length) { setCalificativos(cal); localStorage.setItem('ie_calificativos_v2', JSON.stringify(cal)); }
      } catch { /* si falla, cargar() intentará Turso/localStorage */ }
    })();
  }, []);

  useEffect(() => {
    cargar();
  }, []);

  // Validación defensiva: garantizar que columnas y calificativos siempre sean arrays
  useEffect(() => {
    if (!Array.isArray(columnas)) setColumnas([]);
    if (!Array.isArray(calificativos)) setCalificativos([]);
    if (!Array.isArray(alumnos)) setAlumnos([]);
  }, [columnas, calificativos, alumnos]);

  // Polling cada 30s: detecta cambios de otros docentes en tiempo real
  useEffect(() => {
    const intervalo = setInterval(async () => {
      if (!ultimaSync) return;
      try {
        const rawNuevas = await getCalificacionesDesdeFecha(ultimaSync.toISOString());
        if (rawNuevas.length === 0) return;
        const toArr = (v: any) => { try { const p = typeof v === 'string' ? JSON.parse(v || '[]') : v; return Array.isArray(p) ? p : []; } catch { return []; } };
        const nuevas = rawNuevas.map((c: any) => ({ ...c, marcados: toArr(c.marcados), claves: toArr(c.claves) }));
        setCalificativos(prev => {
          const actualizados = [...prev];
          let contadorNuevos = 0;
          for (const nueva of nuevas) {
            const idx = actualizados.findIndex(c => c.alumnoId === nueva.alumnoId && c.columnaId === nueva.columnaId);
            if (idx >= 0) actualizados[idx] = nueva;
            else { actualizados.push(nueva); contadorNuevos++; }
          }
          if (contadorNuevos > 0) setCambiosRemotos(n => n + contadorNuevos);
          return actualizados;
        });
        setUltimaSync(new Date());
      } catch { /* silencioso — sin conexión */ }
    }, 30_000);
    return () => clearInterval(intervalo);
  }, [ultimaSync]);

  // ── Sincronización manual desde Turso ────────────────────────────────────
  const sincronizarDesdeTurso = async () => {
    setSyncing(true);
    setSyncMsg({ tipo: 'ok', texto: '📥 Descargando datos de la nube...' });
    try {
      // Paso 1: lo esencial (sin calificaciones ni asistencia que son muy grandes)
      const todo = await cargarTodo('alumnos,asignaciones,docentes,columnas,unidades,normas');
      let guardados = 0;
      if (todo.asignaciones?.length) {
        localStorage.setItem('cfg_asignaciones', JSON.stringify(todo.asignaciones));
        guardados++;
      }
      if (todo.alumnos?.length) {
        setAlumnos(todo.alumnos);
        localStorage.setItem('ie_alumnos', JSON.stringify(todo.alumnos));
        guardados++;
      }
      if (todo.docentes?.length) {
        localStorage.setItem('ie_docentes', JSON.stringify(todo.docentes));
        guardados++;
      }
      if (todo.columnas?.length) {
        // Solo actualizar si el servidor tiene MÁS columnas que local (evita perder datos no sincronizados)
        const localCount = parseInt(localStorage.getItem('cal_columnas') || '[]').length || columnas.length;
        if (todo.columnas.length >= localCount) {
          setColumnas(todo.columnas);
          localStorage.setItem('cal_columnas', JSON.stringify(todo.columnas));
        }
        guardados++;
      }
      if (todo.unidades?.length) {
        setBimestres((todo.unidades || []).filter((u: any) => u.activa !== false));
        localStorage.setItem('cfg_unidades', JSON.stringify(todo.unidades));
        guardados++;
      }
      await cargarAsignacion();
      setSyncMsg({ tipo: 'ok', texto: `✅ ${guardados} tablas descargadas de la nube` });
      // Paso 2: calificaciones y asistencia en segundo plano
      try {
        const resto = await cargarTodo('calificaciones,asistencia');
        const toArr = (v: any) => { try { const p = typeof v === 'string' ? JSON.parse(v || '[]') : v; return Array.isArray(p) ? p : []; } catch { return []; } };
        if (Array.isArray(resto.calificaciones) && resto.calificaciones.length > 0) {
          const califs = resto.calificaciones.map((c: any) => ({ ...c, marcados: toArr(c.marcados), claves: toArr(c.claves) }));
          setCalificativos(califs);
          localStorage.setItem('ie_calificativos_v2', JSON.stringify(califs));
        }
        if (Array.isArray(resto.asistencia) && resto.asistencia.length > 0) {
          localStorage.setItem('ie_asistencia', JSON.stringify(resto.asistencia));
        }
      } catch { /* silencioso */ }
    } catch (e: any) {
      // Durante transición a Firebase, Turso puede no responder — no mostrar error feo
      console.warn('Turso no disponible (transición a Firebase):', e.message);
      setSyncMsg({ tipo: 'ok', texto: '✅ Usando datos locales / Firebase' });
    } finally {
      setSyncing(false);
      setTimeout(() => setSyncMsg(null), 4000);
    }
  };

  const handleRecargar = async () => {
    setSyncMsg(null);
    await sincronizarDesdeTurso();
  };

  // ── Filtro por asignación del docente ────────────────────────────────────
  const esDocente = user?.role === 'teacher';

  // Base de alumnos: si docente, solo los de sus grados+secciones
  const alumnosBase = React.useMemo(() => {
    if (!esDocente || !asignacionDocente) return alumnos;
    const gradosNorm    = asignacionDocente.grados.map(normGrado);
    const seccionesNorm = asignacionDocente.secciones.map(s => s.trim().toUpperCase());
    const filtrados = alumnos.filter(a =>
      gradosNorm.includes(normGrado((a as any).grado)) &&
      seccionesNorm.includes(((a as any).seccion || '').trim().toUpperCase())
    );
    // FALLBACK: si el filtro por asignación deja 0 alumnos, mostrar TODOS
    // para que el docente no se quede sin ver nada. Esto indica que la
    // asignación está mal configurada.
    if (filtrados.length === 0 && alumnos.length > 0) {
      console.warn('[EduGest] Filtro por asignación dejó 0 alumnos. Mostrando todos como fallback.');
      return alumnos; // ← fallback crítico: nunca bloquear al docente
    }
    return filtrados;
  }, [alumnos, esDocente, asignacionDocente]);

  // Aviso cuando el filtro real no coincida (sin bloquear la vista)
  const asignacionSinMatch = React.useMemo(() => {
    if (!esDocente || !asignacionDocente || alumnos.length === 0) return false;
    const gradosNorm    = asignacionDocente.grados.map(normGrado);
    const seccionesNorm = asignacionDocente.secciones.map(s => s.trim().toUpperCase());
    return !alumnos.some(a =>
      gradosNorm.includes(normGrado((a as any).grado)) &&
      seccionesNorm.includes(((a as any).seccion || '').trim().toUpperCase())
    );
  }, [alumnos, esDocente, asignacionDocente]);

  const grados = esDocente && asignacionDocente
    ? asignacionDocente.grados.sort()
    : [...new Set(alumnos.map(a => (a as any).grado).filter(Boolean))].sort();
  const secciones = esDocente && asignacionDocente
    ? asignacionDocente.secciones.sort()
    : [...new Set(alumnos.map(a => (a as any).seccion).filter(Boolean))].sort();

  const alumnosFiltrados = alumnosBase.filter(a => {
    const matchG = !filtroGrado   || normGrado((a as any).grado)   === normGrado(filtroGrado);
    const matchS = !filtroSeccion || normSeccion((a as any).seccion) === normSeccion(filtroSeccion);
    const searchTerm = busqueda.toLowerCase();
    const matchSearch = !busqueda || 
      (a.apellidos_nombres || a.nombre || '').toLowerCase().includes(searchTerm) ||
      ((a as any).dni || '').toLowerCase().includes(searchTerm);
    return matchG && matchS && matchSearch;
  }).sort((a, b) => (a.apellidos_nombres || a.nombre || '').localeCompare(b.apellidos_nombres || b.nombre || ''));

  const getCal = (alumnoId: string, columnaId: string) =>
    calificativos.find(c => c.alumnoId === alumnoId && c.columnaId === columnaId);

  const handleGuardarCal = async (cal: Calificativo) => {
    const todos = Array.isArray(calificativos) ? [...calificativos] : [];
    const idx = todos.findIndex(c => c.alumnoId === cal.alumnoId && c.columnaId === cal.columnaId);
    if (idx >= 0) todos[idx] = cal; else todos.push(cal);
    setCalificativos(todos);
    setPopup(null);
    // Actualizar caché en memoria para no invalidarlo (evita re-fetch innecesario)
    actualizarCalEnCache(cal);
    // Guardar en localStorage siempre
    localStorage.setItem('ie_calificativos_v2', JSON.stringify(todos));
    setSyncMsg({ tipo: 'ok', texto: `✅ Calificación guardada` });
    setTimeout(() => setSyncMsg(null), 2000);
    // 1) Firebase primero
    try {
      await guardarCalificativoFB(cal as any);
      setUltimaSync(new Date());
    } catch (fbErr) {
      // 2) Turso como fallback
      try {
        await guardarUnCalificativo(cal);
        setUltimaSync(new Date());
      } catch (err: any) {
        setSyncMsg({ tipo: 'err', texto: `⚠️ Sin internet — guardado local` });
        setTimeout(() => setSyncMsg(null), 5000);
        console.warn('Turso fallback:', err.message);
      }
    }
  };

  const handleGuardarTodo = async (cals: Calificativo[], idsEliminar?: string[]) => {
    let todos = [...calificativos];

    // Eliminar calificaciones de alumnos que quedaron vacíos en la planilla
    if (idsEliminar && idsEliminar.length > 0 && cals.length > 0) {
      const colId = cals[0].columnaId;
      todos = todos.filter(c => !(c.columnaId === colId && idsEliminar.includes(c.alumnoId)));
    }

    cals.forEach(cal => {
      const idx = todos.findIndex(c => c.alumnoId === cal.alumnoId && c.columnaId === cal.columnaId);
      if (idx >= 0) todos[idx] = cal; else todos.push(cal);
      actualizarCalEnCache(cal);
    });
    setCalificativos(todos);
    setPlanillaColumna(null);
    localStorage.setItem('ie_calificativos_v2', JSON.stringify(todos));
    // 1) Firebase primero (batch)
    try {
      await guardarCalificativosBatchFB(cals as any);
      setUltimaSync(new Date());
      const msg = idsEliminar?.length
        ? `✅ ${cals.length} guardadas en Firebase · ${idsEliminar.length} limpiadas`
        : `✅ ${cals.length} calificaciones guardadas en Firebase`;
      setSyncMsg({ tipo: 'ok', texto: msg });
      setTimeout(() => setSyncMsg(null), 3000);
    } catch (fbErr) {
      // 2) Turso como fallback
      try {
        await guardarCalificativos(cals);
        setUltimaSync(new Date());
        const msg = idsEliminar?.length
          ? `✅ ${cals.length} guardadas en Turso · ${idsEliminar.length} limpiadas`
          : `✅ ${cals.length} calificaciones guardadas en Turso`;
        setSyncMsg({ tipo: 'ok', texto: msg });
        setTimeout(() => setSyncMsg(null), 3000);
      } catch (err: any) {
        setSyncMsg({ tipo: 'err', texto: `⚠️ Guardado local — sin internet` });
        setTimeout(() => setSyncMsg(null), 5000);
        console.warn('Error guardando calificativos:', err.message);
      }
    }
  };

  const handleGuardarColumna = async (col: Columna) => {
    const todas = Array.isArray(columnas) ? [...columnas] : [];
    const idx = todas.findIndex(c => c.id === col.id);
    if (idx >= 0) todas[idx] = col; else todas.push(col);

    // Actualizar estado React y cerrar modal primero
    setColumnas(todas);
    setModalColumna(null);
    setSyncMsg({ tipo: 'ok', texto: `✅ Columna "${col.nombre}" ${idx >= 0 ? 'actualizada' : 'creada'}` });
    setTimeout(() => setSyncMsg(null), 3000);

    // Guardar en localStorage (persiste incluso si algo falla después)
    localStorage.setItem('cal_columnas', JSON.stringify(todas));

    // 1) Firebase primero
    try {
      await guardarColumnasFB(todas as any);
      setUltimaSync(new Date());
    } catch (fbErr) {
      // 2) Turso como fallback
      try {
        await guardarColumnas(todas);
      } catch (err: any) {
        console.warn('Sync columnas falló:', err.message);
      }
    }
  };

  // ── Backup automático ─────────────────────────────────────────────────
  const backupAutomatico = () => {
    try {
      const data = {
        alumnos: JSON.parse(localStorage.getItem('ie_alumnos') || '[]'),
        calificaciones: JSON.parse(localStorage.getItem('ie_calificativos_v2') || '[]'),
        columnas: JSON.parse(localStorage.getItem('cal_columnas') || '[]'),
        asignaciones: JSON.parse(localStorage.getItem('cfg_asignaciones') || '[]'),
        usuarios: JSON.parse(localStorage.getItem('sistema_usuarios') || '[]'),
        docentes: JSON.parse(localStorage.getItem('ie_docentes') || '[]'),
        unidades: JSON.parse(localStorage.getItem('cfg_unidades') || '[]'),
        timestamp: new Date().toISOString(),
      };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `backup-edugest-auto-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      console.log('✅ Backup automático descargado');
    } catch (e) {
      console.error('❌ Error en backup automático:', e);
    }
  };

  const eliminarColumna = async (id: string) => {
    if (!confirm('¿Eliminar esta columna y todos sus calificativos?')) return;
    const todas = columnas.filter(c => c.id !== id);
    const cals  = calificativos.filter(c => c.columnaId !== id);
    setColumnas(todas);
    setCalificativos(cals);
    // Guardar primero en localStorage
    localStorage.setItem('cal_columnas', JSON.stringify(todas));
    localStorage.setItem('ie_calificativos_v2', JSON.stringify(cals));
    // 1) Firebase primero
    try {
      await eliminarColumnaFB(id);
      await eliminarCalificativosPorColumnaFB(id);
      setUltimaSync(new Date());
    } catch (fbErr) {
      // 2) Turso como fallback
      try {
        await guardarColumnas(todas);
        await guardarCalificativos(cals);
      } catch (err: any) {
        console.warn('Sync Turso eliminar falló:', err.message);
      }
    }
  };

  const nombre = (a: Alumno) => a.apellidos_nombres || a.nombre || '—';
  const colPorComp = (cid: string) => columnas.filter(c => {
    const matchUnidad = !filtroUnidad || c.bimestreId === filtroUnidad || !c.bimestreId;
    return c.competenciaId === cid && matchUnidad;
  });
  const avance = (alumnoId: string) => {
    if (columnas.length === 0) return 0;
    return Math.round(columnas.filter(c => getCal(alumnoId, c.id)).length / columnas.length * 100);
  };

  // Abrir pop-up correcto según tipo
  const abrirPopup = (alumno: Alumno, columna: Columna) => setPopup({ alumno, columna });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">

      {/* Pop-ups */}
      {popup && (
        popup.columna.tipo === 'examen'
          ? <PopupExamen alumno={popup.alumno} columna={popup.columna} calActual={getCal((popup.alumno as any).id, popup.columna.id)} onGuardar={handleGuardarCal} onCerrar={() => setPopup(null)} />
          : popup.columna.tipo === 'rubrica-2'
            ? <PopupRubrica2 alumno={popup.alumno} columna={popup.columna} calActual={getCal((popup.alumno as any).id, popup.columna.id)} onGuardar={handleGuardarCal} onCerrar={() => setPopup(null)} />
            : popup.columna.tipo === 'rubrica'
              ? <PopupRubrica alumno={popup.alumno} columna={popup.columna} calActual={getCal((popup.alumno as any).id, popup.columna.id)} onGuardar={handleGuardarCal} onCerrar={() => setPopup(null)} />
              : popup.columna.tipo === 'nota-numerica'
                ? <PopupNotaNumerica alumno={popup.alumno} columna={popup.columna} calActual={getCal((popup.alumno as any).id, popup.columna.id)} onGuardar={handleGuardarCal} onCerrar={() => setPopup(null)} />
                : <PopupInstrumento alumno={popup.alumno} columna={popup.columna} calActual={getCal((popup.alumno as any).id, popup.columna.id)} onGuardar={handleGuardarCal} onCerrar={() => setPopup(null)} />
      )}
      {modalColumna !== null && (
        <ModalColumna key={modalColumna.columna?.id || 'nueva'} columnaEditar={modalColumna.columna} onGuardar={handleGuardarColumna} onCerrar={() => setModalColumna(null)} userEmail={user?.email} bimestres={bimestres} />
      )}
      {planillaColumna !== null && (
        <ModalPlanilla columna={planillaColumna} alumnos={alumnosFiltrados} calificativos={calificativos} onGuardarTodo={handleGuardarTodo} onCerrar={() => setPlanillaColumna(null)} />
      )}

      {/* Header */}
      <div className="sticky top-0 z-40 backdrop-blur-xl bg-slate-900/80 border-b border-cyan-500/20">
        <div className="max-w-full px-4 py-4 flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-2xl font-black text-white">📊 Registro de Calificativos</h1>
            <p className="text-cyan-400/70 text-xs mt-0.5">Comunicación · MINEDU · C · B · A · AD</p>
          </div>
          <div className="flex gap-2 flex-wrap items-center">
            {Object.entries(CAL_LABEL).map(([k, v]) => (
              <span key={k} className={`px-2 py-1 rounded border text-xs font-bold ${CAL_BG[k]}`} translate="no">
                {k} <span className="opacity-70 font-normal hidden sm:inline">= {v}</span>
              </span>
            ))}
            <button onClick={() => setShowGestion(v => !v)}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-xs font-bold">
              <Settings size={13}/> Columnas
            </button>
            <button onClick={() => setModalColumna({})}
              className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg text-xs font-bold hover:opacity-90">
              <Plus size={13}/> Nueva columna
            </button>
            <button onClick={() => { setCambiosRemotos(0); handleRecargar(); }} disabled={syncing}
              className="relative flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg text-xs font-bold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed">
              <RefreshCw size={13} className={syncing ? 'animate-spin' : ''}/>
              {syncing ? 'Cargando...' : 'Recargar'}
              {cambiosRemotos > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-orange-500 text-white text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center">
                  {cambiosRemotos > 9 ? '!' : cambiosRemotos}
                </span>
              )}
            </button>
            <button onClick={() => setShowRespaldo(v => !v)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold ${showRespaldo ? 'bg-emerald-500 text-white' : 'bg-emerald-700 hover:bg-emerald-600 text-white'}`}>
              <FileSpreadsheet size={13}/> Respaldo Excel
            </button>
          </div>
        </div>

        {/* Mensaje de sincronización + última sync */}
        <div className="px-4 pb-1 flex items-center gap-3 flex-wrap">
          {syncMsg && (
            <div className={`px-3 py-1.5 rounded-lg ${syncMsg.tipo === 'ok' ? 'bg-green-500/20 border border-green-500/40' : 'bg-red-500/20 border border-red-500/40'}`}>
              <p className={syncMsg.tipo === 'ok' ? 'text-green-300 text-xs font-bold' : 'text-red-300 text-xs font-bold'}>{syncMsg.texto}</p>
            </div>
          )}
          {calProgreso && (
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-32 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-cyan-500 rounded-full transition-all duration-300"
                  style={{ width: `${Math.round((calProgreso.loaded / Math.max(calProgreso.total, 1)) * 100)}%` }}
                />
              </div>
              <p className="text-cyan-400 text-[11px] font-medium">
                Cargando {calProgreso.loaded}/{calProgreso.total} calificativos...
              </p>
            </div>
          )}
          {ultimaSync && !syncMsg && !calProgreso && (
            <p className="text-slate-500 text-[11px]">
              🔄 Sincronizado {ultimaSync.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
              <span className="ml-1 text-slate-600">· auto-refresh c/30s</span>
            </p>
          )}
          {cambiosRemotos > 0 && (
            <span className="px-2 py-1 bg-orange-500/20 border border-orange-500/40 text-orange-300 text-[11px] font-bold rounded-lg animate-pulse">
              🔔 {cambiosRemotos} cambio{cambiosRemotos > 1 ? 's' : ''} de otro docente
            </span>
          )}
        </div>

        {columnas.length > 0 && !filtroUnidad && (
          <div className="px-4 py-2 bg-amber-500/20 border border-amber-500/40 mx-4 rounded-lg">
            <p className="text-amber-300 text-xs font-bold">⚠️ Selecciona una unidad para ver sus columnas independientes</p>
          </div>
        )}
        <div className="px-4 pb-3 flex gap-2 flex-wrap items-center">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input type="text" value={busqueda} onChange={e => setBusqueda(e.target.value)}
              placeholder="Buscar por nombre o DNI..."
              className="bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-white text-xs focus:outline-none focus:border-cyan-500 w-48" />
          </div>
          <select value={filtroUnidad} onChange={e => setFiltroUnidad(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-white text-xs focus:outline-none focus:border-indigo-500">
            <option value="">Selecciona una unidad</option>
            {bimestres.map(b => <option key={b.id} value={b.id}>Unidad {b.numero}: {b.nombre}</option>)}
          </select>
          <select value={filtroGrado} onChange={e => setFiltroGrado(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-white text-xs focus:outline-none focus:border-cyan-500">
            <option value="">Todos los grados</option>
            {grados.map(g => <option key={g} value={g}>{g} Grado</option>)}
          </select>
          <select value={filtroSeccion} onChange={e => setFiltroSeccion(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-white text-xs focus:outline-none focus:border-cyan-500">
            <option value="">Todas las secciones</option>
            {secciones.map(s => <option key={s} value={s}>Sección {s}</option>)}
          </select>
          <span className="text-slate-500 text-xs">{alumnosFiltrados.length} alumnos · {columnas.length} columnas</span>
          {esDocente && asignacionDocente && (
            <span className="text-indigo-400 text-xs bg-indigo-500/10 border border-indigo-500/30 rounded-lg px-2 py-1">
              🏫 {asignacionDocente.grados.join(', ')} · Sec. {asignacionDocente.secciones.join(', ')}
              {asignacionDocente.cursos.length > 0 && ` · ${asignacionDocente.cursos.join(', ')}`}
            </span>
          )}
          {esDocente && !asignacionDocente && (
            <span className="text-amber-400 text-xs bg-amber-500/10 border border-amber-500/30 rounded-lg px-2 py-1">
              ⚠️ Sin asignación — contacta al administrador
            </span>
          )}
        </div>
      </div>

      <div className="px-2 py-4">

        {/* ── Panel Respaldo Excel por instrumento ── */}
        {showRespaldo && (
          <div className="max-w-5xl mx-auto mb-4 bg-slate-800 border border-emerald-700/50 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-white font-bold text-sm flex items-center gap-2">
                  <FileSpreadsheet size={15} className="text-emerald-400"/> Respaldo por instrumento
                </h3>
                <p className="text-slate-400 text-xs mt-0.5">
                  Descarga un Excel con todos los alumnos, sus respuestas pregunta por pregunta y el calificativo.
                </p>
              </div>
              <button onClick={() => exportarTodas(columnas, alumnos, calificativos)}
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold">
                <Download size={13}/> Exportar TODOS ({columnas.length})
              </button>
            </div>
            {columnas.length === 0 ? (
              <p className="text-slate-500 text-sm text-center py-4">Sin columnas configuradas.</p>
            ) : (
              <div className="space-y-1">
                {COMPETENCIAS.map(comp => {
                  const cols = columnas.filter(c => c.competenciaId === comp.id);
                  if (cols.length === 0) return null;
                  return (
                    <div key={comp.id} className="mb-2">
                      <p className={`text-xs font-black mb-1 px-2 ${comp.text}`}>{comp.label} — {comp.nombre}</p>
                      {cols.map(col => {
                        const registrados = calificativos.filter(c => c.columnaId === col.id).length;
                        const pct = alumnos.length > 0 ? Math.round(registrados / alumnos.length * 100) : 0;
                        return (
                          <div key={col.id} className="flex items-center justify-between bg-slate-700/40 rounded-lg px-3 py-2 mb-1">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <span className="text-white text-xs font-medium truncate">{col.nombre}</span>
                              <span className="text-slate-400 text-xs shrink-0">{col.totalItems} ítems</span>
                              <span className="text-slate-500 text-xs shrink-0">{registrados}/{alumnos.length} alumnos ({pct}%)</span>
                              {pct < 100 && <span className="text-amber-400 text-xs shrink-0">⚠ {alumnos.length - registrados} sin registrar</span>}
                            </div>
                            <button onClick={() => exportarColumna(col, alumnos, calificativos)}
                              className="flex items-center gap-1 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold shrink-0 ml-3">
                              <Download size={11}/> Excel
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            )}
            <p className="text-slate-600 text-xs mt-3">
              💾 El archivo se descarga en tu carpeta de Descargas. Ábrelo con Excel o LibreOffice Calc.
              Para exámenes: verde = correcta, rojo = incorrecta.
            </p>
          </div>
        )}

        {/* Panel gestión columnas */}
        {showGestion && (
          <div className="max-w-5xl mx-auto mb-4 bg-slate-800 border border-slate-700 rounded-xl p-4">
            <h3 className="text-white font-bold text-sm mb-3">Columnas configuradas ({columnas.length})</h3>
            {columnas.length === 0 ? (
              <p className="text-slate-500 text-sm text-center py-4">Sin columnas. Agrega una con "Nueva columna".</p>
            ) : (
              <div className="space-y-4">
                {COMPETENCIAS.map(comp => {
                  const cols = colPorComp(comp.id);
                  if (cols.length === 0) return null;
                  return (
                    <div key={comp.id}>
                      <div className={`flex items-center gap-2 mb-2 px-3 py-2 rounded-lg ${comp.bg}`}>
                        <span className={`text-xs font-black ${comp.text}`}>{comp.label}</span>
                        <span className={`text-xs ${comp.text} opacity-80 hidden sm:inline`}>{comp.nombre}</span>
                        <span className="ml-auto text-xs text-slate-400">{cols.filter(c=>c.promediar).length}/{cols.length} en promedio</span>
                      </div>
                      <div className="space-y-1.5 pl-2">
                        {cols.map(col => {
                          const cfg = getTipoConfig(col.tipo);
                          return (
                            <div key={col.id} className="flex items-center justify-between bg-slate-700/50 rounded-xl px-4 py-2.5">
                              <div className="flex items-center gap-3">
                                <span className="text-lg">{cfg.icono}</span>
                                <div>
                                  <p className="text-white text-sm font-medium flex items-center gap-2 flex-wrap">
                                    {col.nombre}
                                    {col.promediar ? <span className="text-xs bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded-full">✅ promedia</span> : <span className="text-xs bg-slate-600/60 text-slate-400 px-1.5 py-0.5 rounded-full">⊘ solo registro</span>}
                                    {cfg.puedeAD && <span className="text-xs bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded-full">⭐ AD posible</span>}
                                  </p>
                                  <p className="text-slate-400 text-xs">
                                    {cfg.label} · {col.totalItems} {col.tipo === 'examen' ? 'preg.' : 'crit.'}
                                    {col.tipo === 'examen' && Array.isArray(col.itemsExamen) && (
                                      <span className="ml-2 text-green-400 font-mono">Claves: {col.itemsExamen.map(i => i.correcta).join('-')}</span>
                                    )}
                                  </p>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <button onClick={() => setPlanillaColumna(col)}
                                  className="flex items-center gap-1 px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded-lg text-xs">
                                  <FileSpreadsheet size={11}/> Planilla
                                </button>
                                <button onClick={() => setModalColumna({ columna: col })}
                                  className="flex items-center gap-1 px-3 py-1.5 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg text-xs">
                                  <Edit2 size={11}/> Editar
                                </button>
                                <button onClick={() => eliminarColumna(col.id)}
                                  className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg text-xs">Eliminar</button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Estados vacíos */}
        {alumnos.length === 0 ? (
          <div className="text-center py-20 space-y-4">
            <p className="text-slate-500">No hay alumnos registrados en el sistema.</p>
            {esDocente && (
              <button onClick={sincronizarDesdeTurso} disabled={syncing}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold rounded-xl text-sm hover:from-green-400 hover:to-emerald-500 transition-all shadow-lg hover:shadow-green-500/30 disabled:opacity-50">
                {syncing ? <RefreshCw size={16} className="animate-spin" /> : <Download size={16} />}
                {syncing ? 'Descargando...' : '📥 Cargar datos de la nube'}
              </button>
            )}
          </div>
        ) : (
          <> {/* Aviso suave cuando la asignación no tiene match, pero SIN bloquear la vista */}
            {asignacionSinMatch && (
              <div className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm bg-amber-500/10 border border-amber-500/30 text-amber-300 mb-4">
                <AlertCircle size={16} />
                <div className="flex-1">
                  <span className="font-bold">Asignación sin alumnos:</span> Tienes <strong>{asignacionDocente.grados.join(', ')}</strong> · Sección <strong>{asignacionDocente.secciones.join(', ')}</strong>.
                  Mostrando todos los {alumnos.length} alumnos del sistema.
                </div>
                <button onClick={() => setAsignacionDocente(null)}
                  className="text-xs text-amber-400 hover:text-amber-300 underline shrink-0">
                  Ver todos
                </button>
              </div>
            )}
            {alumnosFiltrados.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-slate-500">Sin alumnos con ese filtro.</p>
              </div>
            ) : (
              <>
                {columnas.length === 0 && (
              <div className="px-4 py-3 mx-4 mt-4 bg-amber-500/20 border border-amber-500/40 rounded-lg text-center">
                <p className="text-amber-300 text-sm font-bold mb-2">⚠️ Sin columnas configuradas</p>
                <p className="text-amber-300 text-xs mb-3">Agrega columnas de examen, lista de cotejo, ficha de observación o rúbrica</p>
                <button onClick={() => setModalColumna({})}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold rounded-xl hover:opacity-90 text-sm">
                  <Plus size={16}/> Nueva columna
                </button>
              </div>
            )}

          {/* ── TABLA PRINCIPAL ── */}
          <div className="overflow-x-auto rounded-xl border border-slate-700/60">
            <table className="text-xs border-collapse" style={{ minWidth: '100%' }}>
              <thead>
                {/* Fila 1: competencias */}
                <tr className="border-b border-slate-700">
                  <th rowSpan={2} className="sticky left-0 z-20 bg-slate-800 px-2 py-3 text-center text-xs font-bold text-slate-400 uppercase tracking-wider border-r border-slate-700 min-w-[40px]">
                    #
                  </th>
                  <th rowSpan={2} className="sticky left-0 z-20 bg-slate-800 px-3 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider border-r border-slate-700 min-w-[180px]">
                    Alumno
                  </th>
                  {COMPETENCIAS.map(comp => {
                    const cols = colPorComp(comp.id);
                    if (cols.length === 0) return null;
                    const exp = compExpand[comp.id] !== false;
                    const colSpanTotal = exp ? cols.length + 1 : 2;
                    return (
                      <th key={comp.id} colSpan={colSpanTotal} className={`px-3 py-2.5 text-center border-r border-slate-600 ${comp.headerBg}`}>
                        <button onClick={() => setCompExpand(prev => ({ ...prev, [comp.id]: !exp }))}
                          className="flex items-center gap-2 mx-auto text-white font-black text-xs hover:opacity-80 transition-opacity">
                          {exp ? <ChevronDown size={12}/> : <ChevronRight size={12}/>}
                          <span className="text-sm">{comp.label}</span>
                          <span className={`font-normal text-xs hidden lg:inline ${comp.text}`}>{comp.nombre}</span>
                          <span className="bg-white/10 rounded px-1.5 py-0.5">{cols.length}</span>
                          {cols.filter(c=>c.promediar).length > 0 && <span className="bg-green-500/20 text-green-300 rounded px-1.5 py-0.5">{cols.filter(c=>c.promediar).length} prom.</span>}
                        </button>
                      </th>
                    );
                  })}
                  <th rowSpan={2} className="px-3 py-3 text-center text-xs font-bold text-slate-400 min-w-[65px] bg-slate-800">Avance</th>
                </tr>

                {/* Fila 2: subencabezados */}
                <tr className="bg-slate-800 border-b border-slate-700">
                  {COMPETENCIAS.map(comp => {
                    const cols = colPorComp(comp.id);
                    if (cols.length === 0) return null;
                    const exp = compExpand[comp.id] !== false;

                    if (!exp) return (
                      <React.Fragment key={comp.id}>
                        <th className="px-2 py-2 text-center border-r border-slate-700/40 min-w-[70px]">
                          <span className={`text-xs ${comp.text}`}>…{cols.length}</span>
                        </th>
                        <th className={`px-2 py-2 text-center border-r border-slate-600 min-w-[75px] ${comp.headerBg}`}>
                          <div className={`text-xs font-black ${comp.text}`}>Ẋ {comp.label}</div>
                        </th>
                      </React.Fragment>
                    );

                    return (
                      <React.Fragment key={comp.id}>
                        {cols.map(col => (
                          <th key={col.id} className="px-2 py-2 text-center border-r border-slate-700/40 min-w-[90px]">
                            <div className="flex flex-col items-center gap-0.5">
                              <span>{getTipoConfig(col.tipo).icono}</span>
                              <span className="text-slate-300 font-semibold leading-tight">{col.nombre}</span>
                              <span className="text-slate-500 font-normal">{col.totalItems} {col.tipo==='examen'?'preg.':'crit.'}</span>
                              <button onClick={() => setPlanillaColumna(col)} className="text-[10px] text-emerald-400 hover:text-emerald-300 underline mt-0.5">
                                📋 Planilla
                              </button>
                              <span className={col.promediar ? 'text-green-500' : 'text-slate-600'}>
                                {col.promediar ? '✅' : '⊘'}
                              </span>
                            </div>
                          </th>
                        ))}
                        <th className={`px-2 py-2 text-center border-r border-slate-600 min-w-[80px] ${comp.headerBg}`}>
                          <div className={`text-xs font-black ${comp.text}`}>Ẋ {comp.label}</div>
                          <div className="text-xs text-slate-500 font-normal">{cols.filter(c=>c.promediar).length} cols</div>
                        </th>
                      </React.Fragment>
                    );
                  })}
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-700/40">
                {alumnosFiltrados.map((alumno, idx) => {
                  const alumnoId = (alumno as any).id;
                  const av = avance(alumnoId);
                  return (
                    <tr key={alumnoId} className={`transition-colors hover:bg-slate-700/20 ${idx % 2 === 0 ? 'bg-slate-800/20' : 'bg-slate-800/40'}`}>

                      {/* Index number */}
                      <td className="sticky left-0 z-10 bg-inherit px-2 py-2.5 border-r border-slate-700/60 text-center">
                        <span className="text-slate-500 text-xs font-medium">{idx + 1}</span>
                      </td>

                      {/* Nombre alumno — SIEMPRE visible */}
                      <td className="sticky left-0 z-10 bg-inherit px-3 py-2.5 border-r border-slate-700/60">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                            {((alumno as any).sexo === 'Femenino' ? 'A' : (alumno as any).sexo === 'Masculino' ? 'M' : (alumno.apellidos_nombres || alumno.nombre || '').split(' ')[0]?.charAt(0) || '?')}
                          </div>
                          <div className="min-w-0">
                            <p className="text-white text-xs font-semibold">{alumno.apellidos_nombres || alumno.nombre || '—'}</p>
                            <p className="text-slate-500 text-xs">{(alumno as any).grado}° "{(alumno as any).seccion}"</p>
                          </div>
                        </div>
                      </td>

                      {COMPETENCIAS.map(comp => {
                        const cols = colPorComp(comp.id);
                        if (cols.length === 0) return null;
                        const exp = compExpand[comp.id] !== false;
                        const prom = promedioCompetencia(alumnoId, comp.id, columnas, calificativos);

                        if (!exp) {
                          const completadas = cols.filter(c => getCal(alumnoId, c.id)).length;
                          return (
                            <React.Fragment key={comp.id}>
                              <td className="px-2 py-2 text-center border-r border-slate-700/40">
                                <span className={`text-xs font-bold ${comp.text}`}>{completadas}/{cols.length}</span>
                              </td>
                              <CeldaPromedio prom={prom} promBg={comp.promBg} />
                            </React.Fragment>
                          );
                        }

                        return (
                          <React.Fragment key={comp.id}>
                            {cols.map(col => {
                              const cal = getCal(alumnoId, col.id);
                              return (
                                <td key={col.id} className="px-1.5 py-1.5 text-center border-r border-slate-700/30">
                                  <button onClick={() => abrirPopup(alumno, col)}
                                    className={`w-full min-h-[40px] rounded-xl border-2 font-black text-base transition-all hover:scale-105 hover:shadow-lg ${cal ? CAL_BG[cal.calificativo] : 'border-dashed border-slate-600 text-slate-600 hover:border-cyan-500/50 hover:text-cyan-500/50'}`} translate="no">
                                    {cal ? cal.calificativo : <Plus size={14} className="mx-auto"/>}
                                  </button>
                                  {cal && (
                                    <p className="text-slate-500 text-xs mt-0.5">
                                      {cal.calificativo === 'examen' || cal.claves
                                        ? cal.claves?.filter(Boolean).length || 0
                                        : cal.marcados?.filter(Boolean).length || 0}/{cal.claves?.length || cal.marcados?.length || 0}
                                    </p>
                                  )}
                                </td>
                              );
                            })}
                            <CeldaPromedio prom={prom} promBg={comp.promBg} />
                          </React.Fragment>
                        );
                      })}

                      {/* Avance */}
                      <td className="px-2 py-2 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <span className={`text-xs font-bold ${av===100?'text-green-400':av>=50?'text-yellow-400':'text-slate-400'}`}>{av}%</span>
                          <div className="w-12 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full transition-all ${av===100?'bg-green-500':av>=50?'bg-yellow-500':'bg-slate-500'}`} style={{ width:`${av}%` }}/>
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              {/* Statistics Row */}
              <tfoot className="bg-slate-900 border-t-2 border-slate-600">
                <tr>
                  <td colSpan={2} className="sticky left-0 z-10 bg-slate-900 px-4 py-3 border-r border-slate-600">
                    <span className="text-white font-bold text-xs uppercase">Estadísticas</span>
                  </td>
                  {COMPETENCIAS.map(comp => {
                    const cols = colPorComp(comp.id);
                    if (cols.length === 0) return null;
                    const exp = compExpand[comp.id] !== false;
                    
                    if (!exp) {
                      return <td key={comp.id} colSpan={2} className="border-r border-slate-700/40" />;
                    }
                    
                    return (
                      <React.Fragment key={comp.id}>
                        {cols.map(col => {
                          const stats = cols.reduce((acc, c) => {
                            const calCount = calificativos.filter(cal => cal.columnaId === c.id);
                            acc.total += calCount.length;
                            acc.ad += calCount.filter(cal => cal.calificativo === 'AD').length;
                            acc.a += calCount.filter(cal => cal.calificativo === 'A').length;
                            acc.b += calCount.filter(cal => cal.calificativo === 'B').length;
                            acc.c += calCount.filter(cal => cal.calificativo === 'C').length;
                            return acc;
                          }, { total: 0, ad: 0, a: 0, b: 0, c: 0 });
                          
                          const colStats = {
                            total: calificativos.filter(cal => cal.columnaId === col.id).length,
                            ad: calificativos.filter(cal => cal.columnaId === col.id && cal.calificativo === 'AD').length,
                            a: calificativos.filter(cal => cal.columnaId === col.id && cal.calificativo === 'A').length,
                            b: calificativos.filter(cal => cal.columnaId === col.id && cal.calificativo === 'B').length,
                            c: calificativos.filter(cal => cal.columnaId === col.id && cal.calificativo === 'C').length,
                          };
                          
                          return (
                            <td key={col.id} className="px-1 py-2 text-center border-r border-slate-700/40">
                              <div className="flex flex-col gap-0.5 text-[10px]">
                                <div className="flex justify-center gap-1">
                                  {colStats.ad > 0 && <span className="px-1 rounded bg-blue-500/30 text-blue-300 font-bold">{colStats.ad}AD</span>}
                                  {colStats.a > 0 && <span className="px-1 rounded bg-green-500/30 text-green-300 font-bold">{colStats.a}A</span>}
                                  {colStats.b > 0 && <span className="px-1 rounded bg-yellow-500/30 text-yellow-300 font-bold">{colStats.b}B</span>}
                                  {colStats.c > 0 && <span className="px-1 rounded bg-red-500/30 text-red-300 font-bold">{colStats.c}C</span>}
                                </div>
                                <span className="text-slate-500">{colStats.total}/{alumnosFiltrados.length}</span>
                              </div>
                            </td>
                          );
                        })}
                        <td className="border-r border-slate-600 bg-slate-800/50" />
                      </React.Fragment>
                    );
                  })}
                  <td className="bg-slate-800/50" />
                </tr>
              </tfoot>
            </table>
          </div>
        </>
      )}
    </>
  )}
</div>
</div>
  );
}
