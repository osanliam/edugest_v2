import React, { useState, useEffect } from 'react';
import { Plus, X, Save, Settings, ChevronDown, ChevronRight, Edit2, Search } from 'lucide-react';

// ── Competencias ──────────────────────────────────────────────────────────────
const COMPETENCIAS = [
  { id: 'comp1', label: 'C1', nombre: 'Se comunica oralmente en lengua materna',                  color: 'from-violet-500 to-purple-600',  text: 'text-violet-300',  bg: 'bg-violet-500/10',  headerBg: 'bg-violet-900/40',  promBg: 'bg-violet-500/20 border-violet-400/50 text-violet-200' },
  { id: 'comp2', label: 'C2', nombre: 'Lee diversos tipos de textos escritos en lengua materna',  color: 'from-cyan-500 to-blue-600',       text: 'text-cyan-300',    bg: 'bg-cyan-500/10',    headerBg: 'bg-cyan-900/40',    promBg: 'bg-cyan-500/20 border-cyan-400/50 text-cyan-200'       },
  { id: 'comp3', label: 'C3', nombre: 'Escribe diversos tipos de textos en lengua materna',       color: 'from-emerald-500 to-teal-600',    text: 'text-emerald-300', bg: 'bg-emerald-500/10', headerBg: 'bg-emerald-900/40', promBg: 'bg-emerald-500/20 border-emerald-400/50 text-emerald-200' },
];

// ── Tipos de instrumento ──────────────────────────────────────────────────────
type TipoInstrumento = 'examen' | 'lista-cotejo' | 'ficha-observacion' | 'rubrica';

const TIPO_CONFIG: Record<string, { label: string; icono: string; puedeAD: boolean }> = {
  'examen':            { label: 'Examen',              icono: '📝', puedeAD: false },
  'lista-cotejo':      { label: 'Lista de Cotejo',     icono: '☑️', puedeAD: false },
  'ficha-observacion': { label: 'Ficha de Observación',icono: '🔍', puedeAD: false },
  'rubrica':           { label: 'Rúbrica',              icono: '📐', puedeAD: true  },
  'desconocido':       { label: 'Desconocido',         icono: '❓', puedeAD: false },
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
  promediar: boolean;
  itemsExamen?: ItemExamen[]; // solo para examen: clave de respuestas
}

interface Calificativo {
  alumnoId: string;
  columnaId: string;
  marcados: boolean[];          // instrumento/rubrica: logrado por ítem
  claves?: string[];            // examen: letra marcada por alumno
  calificativo: 'C' | 'B' | 'A' | 'AD';
  esAD: boolean;
  fecha: string;
}

// ── localStorage ──────────────────────────────────────────────────────────────
const LS_ALUMNOS  = 'ie_alumnos';
const LS_COLUMNAS = 'cal_columnas';
const LS_CALS     = 'ie_calificativos_v2';

function lsGet(key: string, def: any = []) {
  try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(def)); } catch { return def; }
}
function lsSet(key: string, val: any) { localStorage.setItem(key, JSON.stringify(val)); }

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
  C:  'bg-red-500/25 text-red-300 border-red-500/50',
  B:  'bg-yellow-500/25 text-yellow-200 border-yellow-500/50',
  A:  'bg-green-500/25 text-green-300 border-green-500/50',
  AD: 'bg-blue-500/25 text-blue-300 border-blue-400/60',
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
      <div className="bg-slate-800 border border-amber-500/30 rounded-2xl w-full max-w-2xl shadow-2xl max-h-[92vh] flex flex-col" onClick={e => e.stopPropagation()}>

        {/* Header con datos del alumno SIEMPRE visibles */}
        <div className="px-6 py-4 border-b border-slate-700 flex-shrink-0 bg-slate-700/40 rounded-t-2xl">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-white font-black text-base">{nomAlumno}</p>
              <p className="text-slate-400 text-xs mt-0.5">{(alumno as any).grado}° "{(alumno as any).seccion}"</p>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <span className="px-2 py-1 bg-amber-500/20 border border-amber-500/40 text-amber-300 rounded-lg text-xs font-bold">📝 {columna.nombre}</span>
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
// Pop-up INSTRUMENTO (lista cotejo / ficha observación)  — máximo A
// ─────────────────────────────────────────────────────────────────────────────
function PopupInstrumento({ alumno, columna, calActual, onGuardar, onCerrar }: {
  alumno: Alumno; columna: Columna; calActual?: Calificativo;
  onGuardar: (c: Calificativo) => void; onCerrar: () => void;
}) {
  const cfg = TIPO_CONFIG[columna.tipo];
  const [marcados, setMarcados] = useState<boolean[]>(() =>
    calActual?.marcados ?? Array(columna.totalItems).fill(false)
  );

  const toggle = (i: number) => { const n = [...marcados]; n[i] = !n[i]; setMarcados(n); };
  const ok  = marcados.filter(Boolean).length;
  const pct = columna.totalItems > 0 ? Math.round(ok / columna.totalItems * 100) : 0;
  const cal = calcularEscala(columna.tipo, pct);
  const nomAlumno = alumno.apellidos_nombres || alumno.nombre || '—';

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onClick={onCerrar}>
      <div className="bg-slate-800 border border-cyan-500/30 rounded-2xl w-full max-w-lg shadow-2xl" onClick={e => e.stopPropagation()}>

        {/* Header con datos del alumno SIEMPRE visibles */}
        <div className="px-6 py-4 border-b border-slate-700 bg-slate-700/40 rounded-t-2xl">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-white font-black text-base">{nomAlumno}</p>
              <p className="text-slate-400 text-xs mt-0.5">{(alumno as any).grado}° "{(alumno as any).seccion}"</p>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <span className="px-2 py-1 bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 rounded-lg text-xs font-bold">{cfg.icono} {columna.nombre}</span>
                <span className="text-xs text-slate-500">{cfg.label} · {columna.totalItems} criterios</span>
                <span className="text-xs text-slate-500">Máximo: A</span>
              </div>
            </div>
            <button onClick={onCerrar} className="p-1.5 hover:bg-slate-700 rounded-lg text-slate-400 flex-shrink-0"><X size={18}/></button>
          </div>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div className="flex items-center gap-3 text-xs text-slate-400">
            <span className="flex items-center gap-1.5"><span className="w-4 h-4 rounded bg-green-500 inline-block"></span>Logrado</span>
            <span className="flex items-center gap-1.5"><span className="w-4 h-4 rounded bg-slate-600 inline-block"></span>No logrado</span>
            <span className="ml-auto font-semibold text-white">{ok}/{columna.totalItems} = {pct}%</span>
          </div>
          <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(52px, 1fr))' }}>
            {marcados.map((m, i) => (
              <button key={i} onClick={() => toggle(i)}
                className={`h-12 rounded-xl font-bold text-sm transition-all border-2 ${m ? 'bg-green-500 border-green-400 text-white shadow-lg shadow-green-500/20' : 'bg-slate-700 border-slate-600 text-slate-400 hover:border-slate-500'}`}>
                {i + 1}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-4 bg-slate-700/50 rounded-xl p-4">
            <div className={`w-16 h-16 rounded-xl border-2 flex items-center justify-center text-3xl font-black ${CAL_BG[cal]}`}>{cal}</div>
            <div className="flex-1">
              <p className="text-white font-bold">{CAL_LABEL[cal]}</p>
              <p className="text-slate-400 text-xs mt-0.5">100%=A · 99–55%=B · ≤54%=C</p>
              <p className="text-slate-500 text-xs mt-0.5">Sin AD — máximo logro: A</p>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-slate-700 flex gap-3">
          <button onClick={() => onGuardar({ alumnoId: (alumno as any).id, columnaId: columna.id, marcados, calificativo: cal, esAD: false, fecha: new Date().toISOString().split('T')[0] })}
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
// Pop-up RÚBRICA  — puede llegar a AD manual
// ─────────────────────────────────────────────────────────────────────────────
function PopupRubrica({ alumno, columna, calActual, onGuardar, onCerrar }: {
  alumno: Alumno; columna: Columna; calActual?: Calificativo;
  onGuardar: (c: Calificativo) => void; onCerrar: () => void;
}) {
  const [marcados, setMarcados] = useState<boolean[]>(() =>
    calActual?.marcados ?? Array(columna.totalItems).fill(false)
  );
  const [esAD, setEsAD] = useState(calActual?.esAD ?? false);

  const toggle = (i: number) => { const n = [...marcados]; n[i] = !n[i]; setMarcados(n); if (esAD) setEsAD(false); };
  const ok  = marcados.filter(Boolean).length;
  const pct = columna.totalItems > 0 ? Math.round(ok / columna.totalItems * 100) : 0;
  const calAuto  = calcularEscala('rubrica', pct);
  // AD: solo si esAD y calAuto === 'A' (todos logrados = 100%)
  const calFinal: 'C'|'B'|'A'|'AD' = esAD && calAuto === 'A' ? 'AD' : calAuto;
  const nomAlumno = alumno.apellidos_nombres || alumno.nombre || '—';

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onClick={onCerrar}>
      <div className="bg-slate-800 border border-purple-500/30 rounded-2xl w-full max-w-lg shadow-2xl" onClick={e => e.stopPropagation()}>

        {/* Header con datos del alumno SIEMPRE visibles */}
        <div className="px-6 py-4 border-b border-slate-700 bg-slate-700/40 rounded-t-2xl">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-white font-black text-base">{nomAlumno}</p>
              <p className="text-slate-400 text-xs mt-0.5">{(alumno as any).grado}° "{(alumno as any).seccion}"</p>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <span className="px-2 py-1 bg-purple-500/20 border border-purple-500/40 text-purple-300 rounded-lg text-xs font-bold">📐 {columna.nombre}</span>
                <span className="text-xs text-slate-500">Rúbrica · {columna.totalItems} criterios</span>
                <span className="text-xs text-blue-400 font-semibold">Puede llegar a AD ⭐</span>
              </div>
            </div>
            <button onClick={onCerrar} className="p-1.5 hover:bg-slate-700 rounded-lg text-slate-400 flex-shrink-0"><X size={18}/></button>
          </div>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div className="flex items-center gap-3 text-xs text-slate-400">
            <span className="flex items-center gap-1.5"><span className="w-4 h-4 rounded bg-green-500 inline-block"></span>Logrado</span>
            <span className="flex items-center gap-1.5"><span className="w-4 h-4 rounded bg-slate-600 inline-block"></span>No logrado</span>
            <span className="ml-auto font-semibold text-white">{ok}/{columna.totalItems} = {pct}%</span>
          </div>
          <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(52px, 1fr))' }}>
            {marcados.map((m, i) => (
              <button key={i} onClick={() => toggle(i)}
                className={`h-12 rounded-xl font-bold text-sm transition-all border-2 ${m ? 'bg-green-500 border-green-400 text-white shadow-lg shadow-green-500/20' : 'bg-slate-700 border-slate-600 text-slate-400 hover:border-slate-500'}`}>
                {i + 1}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-4 bg-slate-700/50 rounded-xl p-4">
            <div className={`w-16 h-16 rounded-xl border-2 flex items-center justify-center text-3xl font-black ${CAL_BG[calFinal]}`}>{calFinal}</div>
            <div className="flex-1">
              <p className="text-white font-bold">{CAL_LABEL[calFinal]}</p>
              <p className="text-slate-400 text-xs mt-0.5">100%=A · 99–55%=B · ≤54%=C</p>
            </div>
            {/* AD: solo disponible si todos los criterios están logrados (100%) */}
            {calAuto === 'A' && (
              <button onClick={() => setEsAD(v => !v)}
                className={`px-3 py-2 rounded-xl text-xs font-bold border-2 transition-all ${esAD ? 'bg-blue-500/30 border-blue-400 text-blue-200 shadow shadow-blue-500/20' : 'bg-slate-700 border-slate-600 text-slate-400 hover:border-blue-500 hover:text-blue-400'}`}>
                ⭐ AD<br/><span className="text-xs font-normal opacity-70">Sobrepasa</span>
              </button>
            )}
          </div>

          {calAuto === 'A' && (
            <p className="text-xs text-blue-400/70 text-center">
              ⭐ El alumno logró todos los criterios. Presiona "AD" si considera que sobrepasa el logro esperado.
            </p>
          )}
        </div>

        <div className="px-6 py-4 border-t border-slate-700 flex gap-3">
          <button onClick={() => onGuardar({ alumnoId: (alumno as any).id, columnaId: columna.id, marcados, calificativo: calFinal, esAD, fecha: new Date().toISOString().split('T')[0] })}
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
function ModalColumna({ columnaEditar, onGuardar, onCerrar }: {
  columnaEditar?: Columna; onGuardar: (c: Columna) => void; onCerrar: () => void;
}) {
  const [nombre,    setNombre]    = useState(columnaEditar?.nombre ?? '');
  const [tipo,      setTipo]      = useState<TipoInstrumento>(columnaEditar?.tipo ?? 'lista-cotejo');
  const [total,     setTotal]     = useState(columnaEditar?.totalItems ?? 10);
  const [compId,    setCompId]    = useState(columnaEditar?.competenciaId ?? 'comp1');
  const [promediar, setPromediar] = useState(columnaEditar?.promediar ?? true);
  const [correctas, setCorrectas] = useState<string[]>(() =>
    columnaEditar?.itemsExamen ? columnaEditar.itemsExamen.map(i => i.correcta) : Array(columnaEditar?.totalItems ?? 10).fill('A')
  );

  const ajustarTotal = (n: number) => {
    setTotal(n);
    setCorrectas(prev => n > prev.length ? [...prev, ...Array(n - prev.length).fill('A')] : prev.slice(0, n));
  };

  const guardar = () => {
    if (!nombre.trim()) return;
    const itemsExamen = tipo === 'examen' ? correctas.map(c => ({ correcta: c })) : undefined;
    onGuardar({ id: columnaEditar?.id ?? 'col-' + Date.now(), nombre: nombre.trim(), tipo, totalItems: total, competenciaId: compId, promediar, itemsExamen });
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
              N° de {tipo === 'examen' ? 'preguntas' : 'criterios'} *
            </label>
            <input type="number" min={1} max={50} value={total} onChange={e => ajustarTotal(Number(e.target.value))} className={inp} />
          </div>

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
  const [filtroGrado,   setFiltroGrado]   = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [filtroSeccion, setFiltroSeccion] = useState('');
  const [popup,         setPopup]         = useState<{ alumno: Alumno; columna: Columna } | null>(null);
  const [modalColumna,  setModalColumna]  = useState<{ columna?: Columna } | null>(null);
  const [showGestion,   setShowGestion]   = useState(false);
  const [compExpand,    setCompExpand]    = useState<Record<string, boolean>>({ comp1: true, comp2: true, comp3: true });

  useEffect(() => {
    setAlumnos(lsGet(LS_ALUMNOS));
    setColumnas(lsGet(LS_COLUMNAS));
    setCalificativos(lsGet(LS_CALS));
  }, []);

  const recargar = () => setCalificativos(lsGet(LS_CALS));

  // ── Filtro por asignación del docente ────────────────────────────────────
  // Si es teacher, buscar su asignación en cfg_asignaciones usando docenteId
  // El docenteId lo buscamos por email del usuario logueado en ie_docentes
  const esDocente = user?.role === 'teacher';
  const asignacionDocente = React.useMemo(() => {
    if (!esDocente || !user?.email) return null;
    const docentes: any[] = lsGet('ie_docentes', []);
    const usuarios: any[] = lsGet('sistema_usuarios', []);
    // Buscar el usuario por email para obtener docenteId
    const usrObj = usuarios.find((u: any) => u.email === user.email);
    const docenteId = usrObj?.docenteId || docentes.find((d: any) => d.email === user.email)?.id;
    if (!docenteId) return null;
    const asignaciones: any[] = lsGet('cfg_asignaciones', []);
    // Puede haber múltiples asignaciones para el mismo docente — unir grados y secciones
    const mias = asignaciones.filter((a: any) => a.docenteId === docenteId);
    if (mias.length === 0) return null;
    const grados   = [...new Set(mias.flatMap((a: any) => a.grados))] as string[];
    const secciones = [...new Set(mias.flatMap((a: any) => a.secciones))] as string[];
    return { grados, secciones };
  }, [esDocente, user?.email]);

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

  const handleGuardarCal = (cal: Calificativo) => {
    const todos = lsGet(LS_CALS) as Calificativo[];
    const idx = todos.findIndex(c => c.alumnoId === cal.alumnoId && c.columnaId === cal.columnaId);
    if (idx >= 0) todos[idx] = cal; else todos.push(cal);
    lsSet(LS_CALS, todos);
    recargar();
    setPopup(null);
  };

  const handleGuardarColumna = (col: Columna) => {
    const todas = lsGet(LS_COLUMNAS) as Columna[];
    const idx = todas.findIndex(c => c.id === col.id);
    if (idx >= 0) todas[idx] = col; else todas.push(col);
    lsSet(LS_COLUMNAS, todas);
    setColumnas(todas);
    setModalColumna(null);
  };

  const eliminarColumna = (id: string) => {
    if (!confirm('¿Eliminar esta columna y todos sus calificativos?')) return;
    const todas = columnas.filter(c => c.id !== id);
    lsSet(LS_COLUMNAS, todas);
    setColumnas(todas);
    const cals = calificativos.filter(c => c.columnaId !== id);
    lsSet(LS_CALS, cals);
    setCalificativos(cals);
  };

  const nombre = (a: Alumno) => a.apellidos_nombres || a.nombre || '—';
  const colPorComp = (cid: string) => columnas.filter(c => c.competenciaId === cid);
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
            : <PopupInstrumento alumno={popup.alumno} columna={popup.columna} calActual={getCal((popup.alumno as any).id, popup.columna.id)} onGuardar={handleGuardarCal} onCerrar={() => setPopup(null)} />
      )}
      {modalColumna !== null && (
        <ModalColumna columnaEditar={modalColumna.columna} onGuardar={handleGuardarColumna} onCerrar={() => setModalColumna(null)} />
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
          </div>
        </div>
        <div className="px-4 pb-3 flex gap-2 flex-wrap items-center">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input type="text" value={busqueda} onChange={e => setBusqueda(e.target.value)}
              placeholder="Buscar por nombre o DNI..."
              className="bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-white text-xs focus:outline-none focus:border-cyan-500 w-48" />
          </div>
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
          <div className="text-center py-20 text-slate-500">
            {alumnos.length === 0 ? 'No hay alumnos registrados. Ve al módulo Alumnos para agregarlos.' : 'Sin alumnos con ese filtro.'}
          </div>
        ) : columnas.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-slate-400 text-lg font-bold mb-2">Sin columnas configuradas</p>
            <p className="text-slate-500 text-sm mb-5">Agrega columnas de examen, lista de cotejo, ficha de observación o rúbrica</p>
            <button onClick={() => setModalColumna({})}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold rounded-xl hover:opacity-90">
              <Plus size={16}/> Nueva columna
            </button>
          </div>
        ) : (

          /* ── TABLA PRINCIPAL ── */
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
        )}
      </div>
    </div>
  );
}
