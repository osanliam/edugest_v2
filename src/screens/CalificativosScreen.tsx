import React, { useState, useEffect } from 'react';
import { Plus, X, Save, Settings, ChevronDown, ChevronRight, Edit2, Search, RefreshCw, Download } from 'lucide-react';
import { cargarTodo, guardarCalificativos, guardarColumnas, getAsignaciones } from '../utils/apiClient';

// ── Competencias ──────────────────────────────────────────────────────────────
const COMPETENCIAS = [
  { id: 'comp1', label: 'C1', nombre: 'Lee diversos tipos de textos escritos en lengua materna',  color: 'from-cyan-500 to-blue-600',       text: 'text-cyan-300',    bg: 'bg-cyan-500/10',    headerBg: 'bg-cyan-900/40',    promBg: 'bg-cyan-500/20 border-cyan-400/50 text-cyan-200'       },
  { id: 'comp2', label: 'C2', nombre: 'Escribe diversos tipos de textos en lengua materna',       color: 'from-emerald-500 to-teal-600',    text: 'text-emerald-300', bg: 'bg-emerald-500/10', headerBg: 'bg-emerald-900/40', promBg: 'bg-emerald-500/20 border-emerald-400/50 text-emerald-200' },
  { id: 'comp3', label: 'C3', nombre: 'Se comunica oralmente en lengua materna',                  color: 'from-violet-500 to-purple-600',  text: 'text-violet-300',  bg: 'bg-violet-500/10',  headerBg: 'bg-violet-900/40',  promBg: 'bg-violet-500/20 border-violet-400/50 text-violet-200' },
];

// ── Tipos de instrumento ──────────────────────────────────────────────────────
type TipoInstrumento = 'examen' | 'lista-cotejo' | 'ficha-observacion' | 'rubrica' | 'portafolio-evidencias' | 'registro-anecdotico' | 'escala-valoracion' | 'nota-numerica';

const TIPO_CONFIG: Record<string, { label: string; icono: string; puedeAD: boolean }> = {
  'examen':                 { label: 'Examen',                 icono: '📝', puedeAD: false },
  'lista-cotejo':           { label: 'Lista de Cotejo',          icono: '☑️', puedeAD: false },
  'ficha-observacion':      { label: 'Ficha de Observación',     icono: '🔍', puedeAD: false },
  'rubrica':               { label: 'Rúbrica',               icono: '📐', puedeAD: true  },
  'portafolio-evidencias':  { label: 'Portafolio Evidencias', icono: '📁', puedeAD: false },
  'registro-anecdotico':   { label: 'Registro Anecdótico',  icono: '📋', puedeAD: false },
  'escala-valoracion':    { label: 'Escala de Valoración',icono: '📊', puedeAD: false },
  'nota-numerica':       { label: 'Nota Numérica',       icono: '🔢', puedeAD: false },
  'desconocido':          { label: 'Desconocido',          icono: '❓', puedeAD: false },
};

function getTipoConfig(tipo: string) {
  return TIPO_CONFIG[tipo] || TIPO_CONFIG['desconocido'];
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
  correcta: string; // 'A'|'B'|'C'|'D'|'E'
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
  marcados: boolean[];
  claves?: string[];
  notaNumerica?: number; // solo para nota-numerica: 0-20
  calificativo: 'C' | 'B' | 'A' | 'AD';
  esAD: boolean;
  fecha: string;
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
  const items = columna.itemsExamen || Array(columna.totalItems).fill({ correcta: 'A' });
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
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onClick={onCerrar}>
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-amber-600/50 rounded-2xl w-full max-w-2xl shadow-2xl max-h-[92vh] flex flex-col" onClick={e => e.stopPropagation()}>

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
            <div className={`w-14 h-14 rounded-xl border-2 flex items-center justify-center text-2xl font-black ${CAL_BG[calAuto]}`}>{calAuto}</div>
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
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onClick={onCerrar}>
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-emerald-600/50 rounded-2xl w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
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
          <div className={`w-16 h-16 rounded-xl border-2 flex items-center justify-center text-3xl font-black ${CAL_BG[cal]}`}>{cal}</div>
          <div className="flex-1">
            <p className="text-white font-bold">{CAL_LABEL[cal]}</p>
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
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onClick={onCerrar}>
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-cyan-600/50 rounded-2xl w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>

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
          <div className={`w-16 h-16 rounded-xl border-2 flex items-center justify-center text-3xl font-black ${CAL_BG[cal]}`}>{cal}</div>
          <div className="flex-1">
            <p className="text-white font-bold">{CAL_LABEL[cal]}</p>
            <p className="text-slate-400 text-xs mt-0.5">100%=A · 99–55%=B · ≤54%=C</p>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-slate-700 flex gap-3">
          <button onClick={() => onGuardar({ alumnoId: (alumno as any).id, columnaId: columna.id, marcados: items.map(i => i.respuestas), calificativo: cal, esAD: false, fecha: new Date().toISOString().split('T')[0] })}
            className="flex-1 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 hover:opacity-90">
            <Save size={15}/> Guardar
          </button>
          <button onClick={onCerrar} className="px-5 py-2.5 bg-slate-700 text-white rounded-xl hover:bg-slate-600 text-sm">Cancelar</button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Pop-up RÚBRICA con estructura C/B/A/AD
// ─────────────────────────────────────────────────────────────────────────────
interface ItemRubrica {
  criterio: string;
  respuestas: string[];
}

function PopupRubrica({ alumno, columna, calActual, onGuardar, onCerrar }: {
  alumno: Alumno; columna: Columna; calActual?: Calificativo;
  onGuardar: (c: Calificativo) => void; onCerrar: () => void;
}) {
  const inicialItems = (): ItemRubrica[] => {
    if (calActual?.items?.length) return calActual.items;
    return Array(columna.totalItems).fill(null).map((_, i) => ({
      criterio: `Criterio ${i + 1}`,
      respuestas: ['', '', '', '']
    }));
  };
  
  const [items, setItems] = useState<ItemRubrica[]>(inicialItems);
  const [esAD, setEsAD] = useState(calActual?.esAD ?? false);
  const colsLabel = ['C', 'B', 'A', 'AD'];

  const marcar = (i: number, colIdx: number, valor: string) => {
    const n = [...items];
    n[i].respuestas[colIdx] = n[i].respuestas[colIdx] === valor ? '' : valor;
    setItems(n);
  };

  const calcularCal = (): 'C' | 'B' | 'A' | 'AD' => {
    let suma = 0, count = 0;
    items.forEach(item => {
      const adIdx = item.respuestas.indexOf('AD');
      const aIdx = item.respuestas.indexOf('A');
      const bIdx = item.respuestas.indexOf('B');
      const cIdx = item.respuestas.indexOf('C');
      if (adIdx >= 0) { suma += 4; count++; }
      else if (aIdx >= 0) { suma += 3; count++; }
      else if (bIdx >= 0) { suma += 2; count++; }
      else if (cIdx >= 0) { suma += 1; count++; }
    });
    if (count === 0) return 'C';
    const prom = Math.round(suma / count);
    const labels: Record<number, string> = { 1: 'C', 2: 'B', 3: 'A', 4: 'AD' };
    return labels[Math.min(4, Math.max(1, prom))] as 'C' | 'B' | 'A' | 'AD';
  };
  
  const calAuto = calcularCal();
  const calFinal: 'C'|'B'|'A'|'AD' = esAD && calAuto === 'A' ? 'AD' : calAuto;
  const nomAlumno = alumno.apellidos_nombres || alumno.nombre || '—';

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onClick={onCerrar}>
      <div className="bg-slate-800 border border-purple-500/30 rounded-2xl w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>

        <div className="px-6 py-4 border-b border-slate-700 bg-slate-700/40 rounded-t-2xl sticky top-0 z-10">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-white font-black text-base">{nomAlumno}</p>
              <p className="text-slate-400 text-xs mt-0.5">{(alumno as any).grado}° "{(alumno as any).seccion}"</p>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <span className="px-2 py-1 bg-purple-500/20 border border-purple-500/40 text-purple-300 rounded-lg text-xs font-bold">📐 {columna.nombre}</span>
                <span className="text-xs text-slate-500">Rúbrica · {items.length} criterios</span>
                {calAuto === 'A' && <span className="text-xs text-blue-400 font-semibold">⭐ Puede AD</span>}
              </div>
            </div>
            <button onClick={onCerrar} className="p-1.5 hover:bg-slate-700 rounded-lg text-slate-400 flex-shrink-0"><X size={18}/></button>
          </div>
        </div>

        <div className="px-6 py-4 space-y-3">
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-600">
                  <th className="text-left py-2 px-2 text-slate-400">#</th>
                  <th className="text-left py-2 px-2 text-slate-400 min-w-[200px]">Criterio</th>
                  <th className="text-center py-2 px-2 text-red-400">C (Inicio)</th>
                  <th className="text-center py-2 px-2 text-yellow-400">B (Proceso)</th>
                  <th className="text-center py-2 px-2 text-green-400">A (Logro)</th>
                  <th className="text-center py-2 px-2 text-blue-400">AD (Destacado)</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, i) => (
                  <tr key={i} className="border-b border-slate-700/40">
                    <td className="py-2 px-2 text-slate-500">{i + 1}</td>
                    <td className="py-2 px-2">
                      <input 
                        type="text" 
                        value={item.criterio}
                        onChange={(e) => {
                          const n = [...items];
                          n[i].criterio = e.target.value;
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
                              ? CAL_BG[colsLabel[j]].replace('25', '50').replace('text-', 'text-white bg-')
                              : 'bg-slate-700 border-slate-600 text-slate-400 hover:border-slate-500'
                          }`}
                        >
                          {colsLabel[j]}
                        </button>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <button 
            onClick={() => setItems([...items, { criterio: `Criterio ${items.length + 1}`, respuestas: ['', '', '', ''] }])}
            className="text-xs text-purple-400 hover:underline"
          >
            + Agregar criterio
          </button>
        </div>

        <div className="px-6 py-4 border-t border-slate-700 flex items-center gap-4 bg-slate-700/50 sticky bottom-0">
          <div className={`w-16 h-16 rounded-xl border-2 flex items-center justify-center text-3xl font-black ${CAL_BG[calFinal]}`}>{calFinal}</div>
          <div className="flex-1">
            <p className="text-white font-bold">{CAL_LABEL[calFinal]}</p>
            <p className="text-slate-400 text-xs mt-0.5">Promedio automático</p>
          </div>
          {calAuto === 'A' && (
            <button onClick={() => setEsAD(v => !v)}
              className={`px-3 py-2 rounded-xl text-xs font-bold border-2 transition-all ${esAD ? 'bg-blue-500/30 border-blue-400 text-blue-200' : 'bg-slate-700 border-slate-600 text-slate-400 hover:border-blue-500'}`}>
              ⭐ AD
            </button>
          )}
        </div>

        <div className="px-6 py-4 border-t border-slate-700 flex gap-3">
          <button onClick={() => onGuardar({ alumnoId: (alumno as any).id, columnaId: columna.id, marcados: items.map(i => i.respuestas), calificativo: calFinal, esAD, fecha: new Date().toISOString().split('T')[0] })}
            className="flex-1 py-2.5 bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 hover:opacity-90">
            <Save size={15}/> Guardar
          </button>
          <button onClick={onCerrar} className="px-5 py-2.5 bg-slate-700 text-white rounded-xl hover:bg-slate-600 text-sm">Cancelar</button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Modal NUEVA / EDITAR columna
// ─────────────────────────────────────────────────────────────────────────────
function ModalColumna({ columnaEditar, onGuardar, onCerrar, userEmail, bimestres: bimestresProps }: {
  columnaEditar?: Columna; onGuardar: (c: Columna) => void; onCerrar: () => void; userEmail?: string; bimestres?: any[];
}) {
  const [nombre,    setNombre]    = useState(columnaEditar?.nombre ?? '');
  const [tipo,      setTipo]      = useState<TipoInstrumento>(columnaEditar?.tipo ?? 'lista-cotejo');
  const [total,     setTotal]     = useState(columnaEditar?.totalItems ?? 10);
  const [compId,    setCompId]    = useState(columnaEditar?.competenciaId ?? 'comp1');
  const [bimestreId, setBimestreId] = useState(columnaEditar?.bimestreId ?? '');
  const [promediar, setPromediar] = useState(columnaEditar?.promediar ?? true);
  const [correctas, setCorrectas] = useState<string[]>(() =>
    columnaEditar?.itemsExamen ? columnaEditar.itemsExamen.map(i => i.correcta) : Array(columnaEditar?.totalItems ?? 10).fill('A')
  );
  const [nuevasColumnasEval, setNuevasColumnasEval] = useState<string>(() => {
    if (columnaEditar?.columnasEval) return columnaEditar.columnasEval.join(', ');
    if (tipo === 'lista-cotejo') return 'Sí,No';
    if (tipo === 'ficha-observacion') return 'Logrado,Parcial,No Logrado';
    if (tipo === 'rubrica') return 'C,B,A,AD';
    if (tipo === 'portafolio-evidencias') return 'Presentó,No Presentó';
    if (tipo === 'registro-anecdotico') return 'Positivo,Negativo';
    return 'Siempre,Casi siempre,A veces,Rara vez,Nunca';
  });
  const unidades = bimestresProps || [];

  const ajustarTotal = (n: number) => {
    setTotal(n);
    setCorrectas(prev => n > prev.length ? [...prev, ...Array(n - prev.length).fill('A')] : prev.slice(0, n));
  };

  const guardar = () => {
    if (!nombre.trim()) return;
    const itemsExamen = tipo === 'examen' ? correctas.map(c => ({ correcta: c })) : undefined;
    const cols = nuevasColumnasEval.split(',').map(c => c.trim()).filter(c => c);
    onGuardar({ id: columnaEditar?.id ?? 'col-' + Date.now(), nombre: nombre.trim(), tipo, totalItems: total, competenciaId: compId, bimestreId: bimestreId || undefined, promediar, itemsExamen, columnasEval: cols.length > 0 ? cols : undefined, creatorId: userEmail || 'admin' });
  };

  const inp = "w-full bg-slate-700 border border-slate-600 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500 placeholder-slate-500";

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onClick={onCerrar}>
      <div className="bg-slate-800 border border-indigo-500/30 rounded-2xl w-full max-w-lg max-h-[92vh] flex flex-col" onClick={e => e.stopPropagation()}>
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
        </div>

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
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Celda de promedio por competencia
// ─────────────────────────────────────────────────────────────────────────────
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
  const [showGestion,   setShowGestion]   = useState(false);
  const [compExpand,    setCompExpand]    = useState<Record<string, boolean>>({ comp1: true, comp2: true, comp3: true });
  const [syncing,       setSyncing]       = useState(false);
  const [syncMsg,       setSyncMsg]       = useState<{tipo:'ok'|'err';texto:string}|null>(null);
  const [asignacionDocente, setAsignacionDocente] = useState<{grados:string[]; secciones:string[]} | null>(null);

  const cargar = async () => {
    setSyncing(true);
    try {
      // 1) Base desde localStorage (notas manuales del docente nunca se pierden)
      const localAlumnos = JSON.parse(localStorage.getItem('ie_alumnos') || '[]');
      const localColumnas = JSON.parse(localStorage.getItem('cal_columnas') || '[]');
      const localCalif = JSON.parse(localStorage.getItem('ie_calificativos_v2') || '[]');
      const localUnidades = JSON.parse(localStorage.getItem('cfg_unidades') || '[]');

      setAlumnos(localAlumnos);
      setColumnas(localColumnas);
      setCalificativos(localCalif);
      setBimestres((localUnidades || []).filter((u: any) => u.activa !== false));

      // 2) Descargar desde Turso en segundo plano y actualizar
      try {
        const todo = await cargarTodo();
        if (todo.alumnos?.length > 0) {
          setAlumnos(todo.alumnos);
          localStorage.setItem('ie_alumnos', JSON.stringify(todo.alumnos));
        }
        if (todo.columnas?.length > 0) {
          setColumnas(todo.columnas);
          localStorage.setItem('cal_columnas', JSON.stringify(todo.columnas));
        }
        if (todo.unidades?.length > 0) {
          setBimestres((todo.unidades || []).filter((u: any) => u.activa !== false));
          localStorage.setItem('cfg_unidades', JSON.stringify(todo.unidades));
        }
      } catch {
        // Si falla Turso, ya tenemos localStorage como fallback
      }
    } catch (err: any) {
      setSyncMsg({ tipo: 'err', texto: `❌ Error al cargar: ${err.message}` });
      setTimeout(() => setSyncMsg(null), 4000);
    } finally {
      setSyncing(false);
    }
  };

  // Cargar asignación del docente desde Turso
  const cargarAsignacion = async () => {
    if (!user?.role || user.role !== 'teacher') return;
    try {
      const asigs = await getAsignaciones();
      const docenteId = (user as any).docenteId;
      if (!docenteId) return;
      const mias = asigs.filter((a: any) => a.docenteId === docenteId);
      if (mias.length === 0) return;
      const grados   = [...new Set(mias.flatMap((a: any) => a.grados))] as string[];
      const secciones = [...new Set(mias.flatMap((a: any) => a.secciones))] as string[];
      setAsignacionDocente({ grados, secciones });
    } catch (_) {}
  };

  useEffect(() => {
    cargar();
    cargarAsignacion();
  }, []);

  // ── Sincronización manual desde Turso ────────────────────────────────────
  const sincronizarDesdeTurso = async () => {
    setSyncing(true);
    setSyncMsg({ tipo: 'ok', texto: '📥 Descargando datos de la nube...' });
    try {
      const todo = await cargarTodo();
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
        setColumnas(todo.columnas);
        localStorage.setItem('cal_columnas', JSON.stringify(todo.columnas));
        guardados++;
      }
      if (todo.unidades?.length) {
        setBimestres((todo.unidades || []).filter((u: any) => u.activa !== false));
        localStorage.setItem('cfg_unidades', JSON.stringify(todo.unidades));
        guardados++;
      }
      if (todo.calificaciones?.length) {
        setCalificativos(todo.calificaciones);
        localStorage.setItem('ie_calificativos_v2', JSON.stringify(todo.calificaciones));
        guardados++;
      }
      await cargarAsignacion();
      setSyncMsg({ tipo: 'ok', texto: `✅ ${guardados} tablas descargadas de la nube` });
    } catch (e: any) {
      setSyncMsg({ tipo: 'err', texto: `❌ Error descargando: ${e.message}` });
    } finally {
      setSyncing(false);
      setTimeout(() => setSyncMsg(null), 4000);
    }
  };

  const handleRecargar = async () => {
    setSyncMsg(null);
    await cargar();
    await cargarAsignacion();
    setSyncMsg({ tipo: 'ok', texto: '✅ Datos recargados desde el servidor' });
    setTimeout(() => setSyncMsg(null), 3000);
  };

  // ── Filtro por asignación del docente ────────────────────────────────────
  const esDocente = user?.role === 'teacher';

  // Base de alumnos: si docente, solo los de sus grados+secciones
  const alumnosBase = React.useMemo(() => {
    if (!esDocente || !asignacionDocente) return alumnos;
    return alumnos.filter(a =>
      asignacionDocente.grados.includes((a as any).grado) &&
      asignacionDocente.secciones.includes((a as any).seccion)
    );
  }, [alumnos, esDocente, asignacionDocente]);

  const grados = esDocente && asignacionDocente
    ? asignacionDocente.grados.sort()
    : [...new Set(alumnos.map(a => (a as any).grado).filter(Boolean))].sort();
  const secciones = esDocente && asignacionDocente
    ? asignacionDocente.secciones.sort()
    : [...new Set(alumnos.map(a => (a as any).seccion).filter(Boolean))].sort();

  const alumnosFiltrados = alumnosBase.filter(a => {
    const matchG = !filtroGrado   || (a as any).grado   === filtroGrado;
    const matchS = !filtroSeccion || (a as any).seccion === filtroSeccion;
    const searchTerm = busqueda.toLowerCase();
    const matchSearch = !busqueda || 
      (a.apellidos_nombres || a.nombre || '').toLowerCase().includes(searchTerm) ||
      ((a as any).dni || '').toLowerCase().includes(searchTerm);
    return matchG && matchS && matchSearch;
  }).sort((a, b) => (a.apellidos_nombres || a.nombre || '').localeCompare(b.apellidos_nombres || b.nombre || ''));

  const getCal = (alumnoId: string, columnaId: string) =>
    calificativos.find(c => c.alumnoId === alumnoId && c.columnaId === columnaId);

  const handleGuardarCal = async (cal: Calificativo) => {
    const todos = [...calificativos];
    const idx = todos.findIndex(c => c.alumnoId === cal.alumnoId && c.columnaId === cal.columnaId);
    if (idx >= 0) todos[idx] = cal; else todos.push(cal);
    setCalificativos(todos);
    setPopup(null);
    // Guardar primero en localStorage (nunca se pierde)
    localStorage.setItem('ie_calificativos_v2', JSON.stringify(todos));
    // Backup automático cada 5 notas guardadas
    if (todos.length % 5 === 0) backupAutomatico();
    // Intentar sync con Turso en segundo plano
    try {
      await guardarCalificativos(todos);
    } catch (err: any) {
      console.warn('Sync Turso calificativos falló:', err.message);
    }
  };

  const handleGuardarColumna = async (col: Columna) => {
    const todas = [...columnas];
    const idx = todas.findIndex(c => c.id === col.id);
    if (idx >= 0) todas[idx] = col; else todas.push(col);
    setColumnas(todas);
    setModalColumna(null);
    // Guardar primero en localStorage
    localStorage.setItem('cal_columnas', JSON.stringify(todas));
    // Intentar sync con Turso en segundo plano
    try {
      await guardarColumnas(todas);
    } catch (err: any) {
      console.warn('Sync Turso columnas falló:', err.message);
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
    // Intentar sync con Turso en segundo plano
    try {
      await guardarColumnas(todas);
      await guardarCalificativos(cals);
    } catch (err: any) {
      console.warn('Sync Turso eliminar falló:', err.message);
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
          : popup.columna.tipo === 'rubrica'
            ? <PopupRubrica alumno={popup.alumno} columna={popup.columna} calActual={getCal((popup.alumno as any).id, popup.columna.id)} onGuardar={handleGuardarCal} onCerrar={() => setPopup(null)} />
            : popup.columna.tipo === 'nota-numerica'
              ? <PopupNotaNumerica alumno={popup.alumno} columna={popup.columna} calActual={getCal((popup.alumno as any).id, popup.columna.id)} onGuardar={handleGuardarCal} onCerrar={() => setPopup(null)} />
              : <PopupInstrumento alumno={popup.alumno} columna={popup.columna} calActual={getCal((popup.alumno as any).id, popup.columna.id)} onGuardar={handleGuardarCal} onCerrar={() => setPopup(null)} />
      )}
      {modalColumna !== null && (
        <ModalColumna columnaEditar={modalColumna.columna} onGuardar={handleGuardarColumna} onCerrar={() => setModalColumna(null)} userEmail={user?.email} bimestres={bimestres} />
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
              <span key={k} className={`px-2 py-1 rounded border text-xs font-bold ${CAL_BG[k]}`}>
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
            <button onClick={handleRecargar} disabled={syncing}
              className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg text-xs font-bold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed">
              <RefreshCw size={13} className={syncing ? 'animate-spin' : ''}/> {syncing ? 'Cargando...' : 'Recargar'}
            </button>
            <button onClick={backupAutomatico}
              className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold">
              <Download size={13}/> Backup
            </button>
          </div>
        </div>

        {/* Mensaje de sincronización */}
        {syncMsg && (
          <div className={`px-4 py-2 mx-4 rounded-lg ${syncMsg.tipo === 'ok' ? 'bg-green-500/20 border border-green-500/40' : 'bg-red-500/20 border border-red-500/40'}`}>
            <p className={syncMsg.tipo === 'ok' ? 'text-green-300 text-xs font-bold' : 'text-red-300 text-xs font-bold'}>{syncMsg.texto}</p>
          </div>
        )}

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
              🏫 Grados: {asignacionDocente.grados.join(', ')} · Secciones: {asignacionDocente.secciones.join(', ')}
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
                                    {col.tipo === 'examen' && col.itemsExamen && (
                                      <span className="ml-2 text-green-400 font-mono">Claves: {col.itemsExamen.map(i => i.correcta).join('-')}</span>
                                    )}
                                  </p>
                                </div>
                              </div>
                              <div className="flex gap-2">
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
        {alumnosFiltrados.length === 0 ? (
          <div className="text-center py-20 space-y-4">
            <p className="text-slate-500">
              {alumnos.length === 0 ? 'No hay alumnos registrados.' : 'Sin alumnos con ese filtro.'}
            </p>
            {esDocente && alumnos.length === 0 && (
              <button onClick={sincronizarDesdeTurso} disabled={syncing}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold rounded-xl text-sm hover:from-green-400 hover:to-emerald-500 transition-all shadow-lg hover:shadow-green-500/30 disabled:opacity-50">
                {syncing ? <RefreshCw size={16} className="animate-spin" /> : <Download size={16} />}
                {syncing ? 'Descargando...' : '📥 Cargar datos de la nube'}
              </button>
            )}
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
                                    className={`w-full min-h-[40px] rounded-xl border-2 font-black text-base transition-all hover:scale-105 hover:shadow-lg ${cal ? CAL_BG[cal.calificativo] : 'border-dashed border-slate-600 text-slate-600 hover:border-cyan-500/50 hover:text-cyan-500/50'}`}>
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
      </div>
    </div>
  );
}
