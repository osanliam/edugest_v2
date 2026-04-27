import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Plus, Trash2, Edit2, Check, X, Save, RefreshCw, AlertCircle, Wifi, WifiOff, Database, Key, Server, Settings, Download } from 'lucide-react';
import HeaderElegante from '../components/HeaderElegante';
import { getStorageStats, isSyncedToCloud, syncAllToTurso, syncToTurso } from '../services/dataService';
import { getAsignaciones as getAsignacionesTurso } from '../utils/apiClient';

// ── Tipos ─────────────────────────────────────────────────────────────────────
interface Bimestre {
  id: string;
  nombre: string;
  inicio: string;
  fin: string;
  activo: boolean;
}

interface Instrumento {
  id: string;
  nombre: string;
  tipo: 'examen' | 'lista-cotejo' | 'ficha-observacion' | 'rubrica' | 'portafolio-evidencias' | 'registro-anecdotico' | 'escala-valoracion';
  calificativo: 'ABC' | 'AD_A_B_C';
  descripcion: string;
  columnas?: number;
  filas?: number;
}

interface Unidad {
  id: string;
  numero: number;
  nombre: string;
  bimestreId: string;
  activa?: boolean;
}

interface AnioAcademico {
  id: string;
  año: number;
  activo: boolean;
}

const LS = {
  bimestres: 'cfg_bimestres',
  instrumentos: 'cfg_instrumentos',
  unidades: 'cfg_unidades',
  anios: 'cfg_anios',
};

function lsGet(key: string, def: any = []) {
  try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(def)); } catch { return def; }
}
function lsSet(key: string, val: any) {
  localStorage.setItem(key, JSON.stringify(val));
}

const inputCls = "w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-sm";
const sectionCls = "bg-slate-800/60 border border-slate-700/60 rounded-xl p-5 space-y-4";

// ── Componentes pequeños ──────────────────────────────────────────────────────
function Msg({ tipo, texto }: { tipo: 'ok'|'err'; texto: string }) {
  return (
    <div className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm ${tipo === 'ok' ? 'bg-green-500/20 border border-green-500/40 text-green-300' : 'bg-red-500/20 border border-red-500/40 text-red-300'}`}>
      {tipo === 'ok' ? <Check size={14} /> : <AlertCircle size={14} />} {texto}
    </div>
  );
}

// ── BIMESTRES ─────────────────────────────────────────────────────────────────
function BimestresSection() {
  const [lista, setLista] = useState<Bimestre[]>([]);
  const [form, setForm] = useState<Bimestre | null>(null);
  const [msg, setMsg] = useState<{tipo:'ok'|'err';texto:string}|null>(null);

  useEffect(() => { setLista(lsGet(LS.bimestres)); }, []);

  const guardar = () => {
    if (!form?.nombre) return setMsg({tipo:'err',texto:'Ingresa el nombre del bimestre'});
    const todos = [...lista];
    const idx = todos.findIndex(b => b.id === form.id);
    if (idx >= 0) todos[idx] = form;
    else todos.push({ ...form, id: 'bim-' + Date.now() });
    lsSet(LS.bimestres, todos);
    setLista(todos);
    setForm(null);
    setMsg({tipo:'ok',texto:'Bimestre guardado'});
    setTimeout(() => setMsg(null), 2500);
  };

  const eliminar = (id: string) => {
    const todos = lista.filter(b => b.id !== id);
    lsSet(LS.bimestres, todos);
    setLista(todos);
  };

  const toggleActivo = (id: string) => {
    const todos = lista.map(b => ({ ...b, activo: b.id === id ? !b.activo : b.activo }));
    lsSet(LS.bimestres, todos);
    setLista(todos);
  };

  return (
    <div className={sectionCls}>
      <div className="flex items-center justify-between">
        <h2 className="text-white font-bold text-base flex items-center gap-2">📅 Bimestres</h2>
        <button onClick={() => setForm({ id: '', nombre: '', inicio: '', fin: '', activo: true })}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold">
          <Plus size={13} /> Agregar
        </button>
      </div>
      {msg && <Msg {...msg} />}
      {form && (
        <div className="bg-slate-700/50 rounded-xl p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-1">
              <label className="block text-xs text-slate-400 mb-1">Nombre *</label>
              <input type="text" value={form.nombre} onChange={e => setForm({...form, nombre: e.target.value})}
                placeholder="I Bimestre" className={inputCls} />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Inicio</label>
              <input type="date" value={form.inicio} onChange={e => setForm({...form, inicio: e.target.value})} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Fin</label>
              <input type="date" value={form.fin} onChange={e => setForm({...form, fin: e.target.value})} className={inputCls} />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={guardar} className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5">
              <Save size={13} /> Guardar
            </button>
            <button onClick={() => setForm(null)} className="px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded-lg text-xs">Cancelar</button>
          </div>
        </div>
      )}
      <div className="space-y-2">
        {lista.length === 0 && <p className="text-slate-500 text-sm text-center py-4">Sin bimestres configurados</p>}
        {lista.map(b => (
          <div key={b.id} className="flex items-center justify-between bg-slate-700/40 rounded-lg px-4 py-3">
            <div>
              <span className={`font-bold text-sm ${b.activo ? 'text-white' : 'text-slate-500'}`}>{b.nombre}</span>
              {b.inicio && <span className="text-slate-400 text-xs ml-3">{b.inicio} → {b.fin}</span>}
              {b.activo && <span className="ml-2 px-1.5 py-0.5 bg-green-500/20 text-green-400 rounded text-xs">Activo</span>}
            </div>
            <div className="flex gap-2">
              <button onClick={() => toggleActivo(b.id)}
                className={`px-2 py-1 rounded text-xs font-bold ${b.activo ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'}`}>
                {b.activo ? 'Desactivar' : 'Activar'}
              </button>
              <button onClick={() => setForm({...b})} className="p-1.5 bg-blue-500/20 hover:bg-blue-500/30 rounded text-blue-400"><Edit2 size={12} /></button>
              <button onClick={() => eliminar(b.id)} className="p-1.5 bg-red-500/20 hover:bg-red-500/30 rounded text-red-400"><Trash2 size={12} /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── INSTRUMENTOS ──────────────────────────────────────────────────────────────
function InstrumentosSection() {
  const [lista, setLista] = useState<Instrumento[]>([]);
  const [form, setForm] = useState<Instrumento | null>(null);
  const [msg, setMsg] = useState<{tipo:'ok'|'err';texto:string}|null>(null);

  useEffect(() => { setLista(lsGet(LS.instrumentos)); }, []);

  const guardar = () => {
    if (!form?.nombre) return setMsg({tipo:'err',texto:'Ingresa el nombre del instrumento'});
    const todos = [...lista];
    const idx = todos.findIndex(i => i.id === form.id);
    if (idx >= 0) todos[idx] = form;
    else todos.push({ ...form, id: 'ins-' + Date.now() });
    lsSet(LS.instrumentos, todos);
    setLista(todos);
    setForm(null);
    setMsg({tipo:'ok',texto:'Instrumento guardado'});
    setTimeout(() => setMsg(null), 2500);
  };

  const eliminar = (id: string) => {
    const todos = lista.filter(i => i.id !== id);
    lsSet(LS.instrumentos, todos);
    setLista(todos);
  };

  const TIPOS = [
    { v: 'examen', l: 'Examen' },
    { v: 'lista-cotejo', l: 'Lista de Cotejo' },
    { v: 'ficha-observacion', l: 'Ficha de Observación' },
    { v: 'rubrica', l: 'Rúbrica' },
    { v: 'portafolio-evidencias', l: 'Portafolio de Evidencias' },
    { v: 'registro-anecdotico', l: 'Registro Anecdótico' },
    { v: 'escala-valoracion', l: 'Escala de Valoración' },
  ];
  const COLUMNAS = [
    { v: '2', l: '2 columnas' },
    { v: '3', l: '3 columnas' },
    { v: '4', l: '4 columnas' },
    { v: '5', l: '5 columnas' },
  ];
  const CAL = [
    { v: 'ABC', l: 'C / B / A (sin AD manual)' },
    { v: 'AD_A_B_C', l: 'C / B / A / AD (con AD manual)' },
  ];

  return (
    <div className={sectionCls}>
      <div className="flex items-center justify-between">
        <h2 className="text-white font-bold text-base flex items-center gap-2">📋 Instrumentos de Evaluación</h2>
        <button onClick={() => setForm({ id:'', nombre:'', tipo:'examen', calificativo:'ABC', descripcion:'', columnas: 2, filas: 5 })}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold">
          <Plus size={13} /> Agregar
        </button>
      </div>
      <p className="text-slate-500 text-xs">Los instrumentos definen qué calificativo se usa: C/B/A (≥80%=A, ≥40%=B) o con AD manual.</p>
      {msg && <Msg {...msg} />}
      {form && (
        <div className="bg-slate-700/50 rounded-xl p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs text-slate-400 mb-1">Nombre *</label>
              <input type="text" value={form.nombre} onChange={e => setForm({...form, nombre: e.target.value})}
                placeholder="Lista de cotejo, Rúbrica, Prueba escrita..." className={inputCls} />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Tipo</label>
              <select value={form.tipo} onChange={e => setForm({...form, tipo: e.target.value as any})} className={inputCls}>
                {TIPOS.map(t => <option key={t.v} value={t.v}>{t.l}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Escala de calificativos</label>
              <select value={form.calificativo} onChange={e => setForm({...form, calificativo: e.target.value as any})} className={inputCls}>
                {CAL.map(c => <option key={c.v} value={c.v}>{c.l}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Filas (indicadores)</label>
              <select value={form.filas?.toString() || '5'} onChange={(e) => setForm({...form, filas: parseInt(e.target.value) })} className={inputCls}>
                {COLUMNAS.map(c => <option key={c.v} value={c.v}>{c.l}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Columnas (opciones)</label>
              <select value={form.columnas?.toString() || '2'} onChange={(e) => setForm({...form, columnas: parseInt(e.target.value) })} className={inputCls}>
                {COLUMNAS.map(c => <option key={c.v} value={c.v}>{c.l}</option>)}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs text-slate-400 mb-1">Descripción (opcional)</label>
              <input type="text" value={form.descripcion} onChange={e => setForm({...form, descripcion: e.target.value})}
                placeholder="Descripción breve..." className={inputCls} />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={guardar} className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5">
              <Save size={13} /> Guardar
            </button>
            <button onClick={() => setForm(null)} className="px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded-lg text-xs">Cancelar</button>
          </div>
        </div>
      )}
      <div className="space-y-2">
        {lista.length === 0 && <p className="text-slate-500 text-sm text-center py-4">Sin instrumentos configurados</p>}
        {lista.map(ins => (
          <div key={ins.id} className="flex items-center justify-between bg-slate-700/40 rounded-lg px-4 py-3">
            <div>
              <span className="text-white font-bold text-sm">{ins.nombre}</span>
              <div className="flex gap-2 mt-0.5 flex-wrap">
                <span className="text-xs px-2 py-0.5 bg-blue-500/20 text-blue-300 rounded">{ins.tipo === 'examen' ? 'Examen' : 'Instrumento'}</span>
                <span className="text-xs px-2 py-0.5 bg-indigo-500/20 text-indigo-300 rounded">
                  {ins.calificativo === 'AD_A_B_C' ? 'C/B/A/AD' : 'C/B/A'}
                </span>
                {ins.descripcion && <span className="text-xs text-slate-400">{ins.descripcion}</span>}
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setForm({...ins})} className="p-1.5 bg-blue-500/20 hover:bg-blue-500/30 rounded text-blue-400"><Edit2 size={12} /></button>
              <button onClick={() => eliminar(ins.id)} className="p-1.5 bg-red-500/20 hover:bg-red-500/30 rounded text-red-400"><Trash2 size={12} /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── UNIDADES ──────────────────────────────────────────────────────────────────
function UnidadesSection() {
  const [lista, setLista] = useState<Unidad[]>([]);
  const [bimestres, setBimestres] = useState<Bimestre[]>([]);
  const [form, setForm] = useState<Unidad | null>(null);
  const [msg, setMsg] = useState<{tipo:'ok'|'err';texto:string}|null>(null);
  const [mostrarActivas, setMostrarActivas] = useState(true);

  useEffect(() => {
    setLista(lsGet(LS.unidades));
    setBimestres(lsGet(LS.bimestres));
  }, []);

  const guardar = () => {
    if (!form?.nombre || form.numero === null || form.numero === undefined) return setMsg({tipo:'err',texto:'Completa número y nombre'});
    const todos = [...lista];
    const idx = todos.findIndex(u => u.id === form.id);
    if (idx >= 0) todos[idx] = form;
    else todos.push({ ...form, id: 'uni-' + Date.now(), activa: form.activa !== false });
    lsSet(LS.unidades, todos);
    syncToTurso('unidades', todos);
    setLista(todos);
    setForm(null);
    setMsg({tipo:'ok',texto:'Unidad guardada'});
    setTimeout(() => setMsg(null), 2500);
  };

  const toggleActiva = (u: Unidad) => {
    const todos = lista.map(x => x.id === u.id ? { ...x, activa: !x.activa } : x);
    lsSet(LS.unidades, todos);
    syncToTurso('unidades', todos);
    setLista(todos);
  };

  const eliminar = (id: string) => {
    const todos = lista.filter(u => u.id !== id);
    lsSet(LS.unidades, todos);
    syncToTurso('unidades', todos);
    setLista(todos);
  };

  return (
    <div className={sectionCls}>
      <div className="flex items-center justify-between">
        <h2 className="text-white font-bold text-base flex items-center gap-2">📚 Unidades Didácticas</h2>
        <button onClick={() => setForm({ id:'', numero: lista.length, nombre:'', bimestreId:'', activa: true })}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold">
          <Plus size={13} /> Agregar
        </button>
      </div>
      {msg && <Msg {...msg} />}
      {form && (
        <div className="bg-slate-700/50 rounded-xl p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1">N° *</label>
              <input type="number" min={0} value={form.numero} onChange={e => setForm({...form, numero: Number(e.target.value)})} className={inputCls} />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs text-slate-400 mb-1">Nombre *</label>
              <input type="text" value={form.nombre} onChange={e => setForm({...form, nombre: e.target.value})}
                placeholder="Unidad 1: Nos conocemos..." className={inputCls} />
            </div>
            <div className="sm:col-span-3">
              <label className="block text-xs text-slate-400 mb-1">Bimestre (opcional)</label>
              <select value={form.bimestreId} onChange={e => setForm({...form, bimestreId: e.target.value})} className={inputCls}>
                <option value="">Sin asignar</option>
                {bimestres.map(b => <option key={b.id} value={b.id}>{b.nombre}</option>)}
              </select>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-xs text-white">
              <input type="checkbox" checked={form.activa !== false} onChange={e => setForm({...form, activa: e.target.checked})} className="rounded" />
              visible para docentes
            </label>
            <button onClick={guardar} className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5">
              <Save size={13} /> Guardar
            </button>
            <button onClick={() => setForm(null)} className="px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded-lg text-xs">Cancelar</button>
          </div>
        </div>
      )}
      <div className="space-y-2">
        {lista.length === 0 && <p className="text-slate-500 text-sm text-center py-4">Sin unidades configuradas</p>}
        {[...lista].sort((a,b) => a.numero - b.numero).filter(u => mostrarActivas ? u.activa !== false : true).map(u => {
          const bim = bimestres.find(b => b.id === u.bimestreId);
          return (
            <div key={u.id} className={`flex items-center justify-between rounded-lg px-4 py-3 ${u.activa === false ? 'bg-slate-800/50 opacity-50' : 'bg-slate-700/40'}`}>
              <div className="flex items-center gap-2">
                <button onClick={() => toggleActiva(u)} className={`w-6 h-6 rounded flex items-center justify-center text-xs ${u.activa !== false ? 'bg-green-500 text-white' : 'bg-slate-600 text-slate-400'}`}>
                  {u.activa !== false ? '✓' : '✗'}
                </button>
                <div>
                  <span className="text-slate-400 text-xs font-bold mr-2">Unidad {u.numero}</span>
                  <span className="text-white text-sm font-medium">{u.nombre}</span>
                  {bim && <span className="ml-2 text-xs text-indigo-400">{bim.nombre}</span>}
                  {u.activa === false && <span className="ml-2 text-xs text-red-400">(oculta)</span>}
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setForm({...u})} className="p-1.5 bg-blue-500/20 hover:bg-blue-500/30 rounded text-blue-400"><Edit2 size={12} /></button>
                <button onClick={() => eliminar(u.id)} className="p-1.5 bg-red-500/20 hover:bg-red-500/30 rounded text-red-400"><Trash2 size={12} /></button>
              </div>
            </div>
          );
        })}
        <div className="flex items-center gap-2 pt-2">
          <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
            <input type="checkbox" checked={mostrarActivas} onChange={e => setMostrarActivas(e.target.checked)} className="rounded" />
            Solo unidades activas
          </label>
          <span className="text-xs text-slate-500">
            ({lista.filter(u => u.activa !== false).length} de {lista.length})
          </span>
        </div>
      </div>
    </div>
  );
}

// ── AÑOS ACADÉMICOS ───────────────────────────────────────────────────────────
function AniosSection() {
  const [lista, setLista] = useState<AnioAcademico[]>([]);
  const [nuevoAnio, setNuevoAnio] = useState(new Date().getFullYear());

  useEffect(() => { setLista(lsGet(LS.anios)); }, []);

  const agregar = () => {
    if (lista.some(a => a.año === nuevoAnio)) return;
    const todos = [...lista, { id: 'yr-' + Date.now(), año: nuevoAnio, activo: false }];
    lsSet(LS.anios, todos);
    setLista(todos);
  };

  const setActivo = (id: string) => {
    const todos = lista.map(a => ({ ...a, activo: a.id === id }));
    lsSet(LS.anios, todos);
    setLista(todos);
  };

  const eliminar = (id: string) => {
    const todos = lista.filter(a => a.id !== id);
    lsSet(LS.anios, todos);
    setLista(todos);
  };

  return (
    <div className={sectionCls}>
      <h2 className="text-white font-bold text-base flex items-center gap-2">🗓️ Años Académicos</h2>
      <div className="flex gap-2">
        <input type="number" value={nuevoAnio} onChange={e => setNuevoAnio(Number(e.target.value))}
          min={2020} max={2035} className="w-32 bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500" />
        <button onClick={agregar} className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold">
          <Plus size={13} /> Agregar año
        </button>
      </div>
      <div className="space-y-2">
        {lista.length === 0 && <p className="text-slate-500 text-sm text-center py-4">Sin años configurados</p>}
        {[...lista].sort((a,b) => b.año - a.año).map(a => (
          <div key={a.id} className="flex items-center justify-between bg-slate-700/40 rounded-lg px-4 py-3">
            <div className="flex items-center gap-3">
              <span className={`text-lg font-black ${a.activo ? 'text-indigo-300' : 'text-white'}`}>{a.año}</span>
              {a.activo && <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-300 text-xs rounded font-bold">AÑO ACTIVO</span>}
            </div>
            <div className="flex gap-2">
              {!a.activo && (
                <button onClick={() => setActivo(a.id)}
                  className="px-3 py-1.5 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 rounded text-xs font-bold">
                  Activar
                </button>
              )}
              <button onClick={() => eliminar(a.id)} className="p-1.5 bg-red-500/20 hover:bg-red-500/30 rounded text-red-400"><Trash2 size={12} /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── COMPETENCIAS ──────────────────────────────────────────────────────────────
function CompetenciasSection() {
  const LS_KEY = 'cfg_competencias';
  const [lista, setLista] = useState<string[]>([]);
  const [nuevo, setNuevo] = useState('');

  useEffect(() => {
    const guardadas = lsGet(LS_KEY, [
      'Lee textos diversos',
      'Produce textos escritos',
      'Interactúa oralmente',
    ]);
    setLista(guardadas);
  }, []);

  const agregar = () => {
    if (!nuevo.trim() || lista.includes(nuevo.trim())) return;
    const todas = [...lista, nuevo.trim()];
    lsSet(LS_KEY, todas);
    setLista(todas);
    setNuevo('');
  };

  const eliminar = (idx: number) => {
    const todas = lista.filter((_, i) => i !== idx);
    lsSet(LS_KEY, todas);
    setLista(todas);
  };

  return (
    <div className={sectionCls}>
      <h2 className="text-white font-bold text-base flex items-center gap-2">🎯 Competencias CNEB</h2>
      <div className="flex gap-2">
        <input type="text" value={nuevo} onChange={e => setNuevo(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && agregar()}
          placeholder="Ej: Lee textos diversos de distintos tipos..." className={inputCls} />
        <button onClick={agregar} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold flex-shrink-0">
          <Plus size={14} />
        </button>
      </div>
      <div className="space-y-2">
        {lista.map((c, i) => (
          <div key={i} className="flex items-center justify-between bg-slate-700/40 rounded-lg px-4 py-3">
            <span className="text-white text-sm">{c}</span>
            <button onClick={() => eliminar(i)} className="p-1.5 bg-red-500/20 hover:bg-red-500/30 rounded text-red-400 ml-3 flex-shrink-0">
              <X size={12} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── CURSOS ────────────────────────────────────────────────────────────────────
const LS_CURSOS = 'cfg_cursos';
interface Curso { id: string; nombre: string; color: string; }
const COLORES_CURSO = ['from-blue-500 to-cyan-600','from-violet-500 to-purple-600','from-emerald-500 to-teal-600','from-rose-500 to-pink-600','from-amber-500 to-orange-600','from-indigo-500 to-blue-600'];

function CursosSection() {
  const [cursos, setCursos] = useState<Curso[]>([]);

  useEffect(() => {
    setCursos(lsGet(LS_CURSOS, [{ id:'cur-1', nombre:'Comunicación', color:'from-violet-500 to-purple-600' }]));
  }, []);
  const [nuevo, setNuevo] = useState('');
  const [editId, setEditId] = useState<string|null>(null);
  const [editNombre, setEditNombre] = useState('');
  const [msg, setMsg] = useState<{tipo:'ok'|'err';texto:string}|null>(null);

  const guardar = (data: Curso[]) => { lsSet(LS_CURSOS, data); setCursos(data); };
  const flash = (tipo:'ok'|'err', texto:string) => { setMsg({tipo,texto}); setTimeout(()=>setMsg(null),3000); };

  const agregar = () => {
    if (!nuevo.trim()) return flash('err','Escribe el nombre del curso');
    if (cursos.some(c=>c.nombre.toLowerCase()===nuevo.trim().toLowerCase())) return flash('err','Ese curso ya existe');
    const nc: Curso = { id:'cur-'+Date.now(), nombre:nuevo.trim(), color: COLORES_CURSO[cursos.length % COLORES_CURSO.length] };
    guardar([...cursos, nc]);
    setNuevo('');
    flash('ok','Curso agregado');
  };

  const eliminar = (id: string) => {
    if (!confirm('¿Eliminar este curso?')) return;
    guardar(cursos.filter(c=>c.id!==id));
    flash('ok','Curso eliminado');
  };

  const guardarEdit = (id: string) => {
    if (!editNombre.trim()) return;
    guardar(cursos.map(c=>c.id===id?{...c,nombre:editNombre.trim()}:c));
    setEditId(null);
    flash('ok','Actualizado');
  };

  return (
    <div className={sectionCls}>
      <h2 className="text-white font-bold text-lg flex items-center gap-2">📖 Cursos / Áreas</h2>
      {msg && <Msg tipo={msg.tipo} texto={msg.texto}/>}
      <div className="flex gap-2">
        <input value={nuevo} onChange={e=>setNuevo(e.target.value)} onKeyDown={e=>e.key==='Enter'&&agregar()}
          placeholder="Nombre del curso (ej: Matemática, CTA...)" className={inputCls}/>
        <button onClick={agregar} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold text-sm flex-shrink-0">
          <Plus size={16}/>
        </button>
      </div>
      <div className="space-y-2 mt-2">
        {cursos.length===0 && <p className="text-slate-500 text-sm text-center py-4">Sin cursos. Agrega el primero.</p>}
        {cursos.map(c=>(
          <div key={c.id} className="flex items-center gap-3 bg-slate-700/50 rounded-xl px-4 py-3">
            <div className={`w-3 h-8 rounded-full bg-gradient-to-b ${c.color} flex-shrink-0`}/>
            {editId===c.id ? (
              <input value={editNombre} onChange={e=>setEditNombre(e.target.value)} onKeyDown={e=>e.key==='Enter'&&guardarEdit(c.id)}
                className="flex-1 bg-slate-600 border border-slate-500 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-indigo-500" autoFocus/>
            ) : (
              <span className="flex-1 text-white font-semibold">{c.nombre}</span>
            )}
            <div className="flex gap-2">
              {editId===c.id ? (
                <>
                  <button onClick={()=>guardarEdit(c.id)} className="p-1.5 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg"><Check size={14}/></button>
                  <button onClick={()=>setEditId(null)} className="p-1.5 bg-slate-600 hover:bg-slate-500 text-slate-300 rounded-lg"><X size={14}/></button>
                </>
              ) : (
                <>
                  <button onClick={()=>{setEditId(c.id);setEditNombre(c.nombre);}} className="p-1.5 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg"><Edit2 size={14}/></button>
                  <button onClick={()=>eliminar(c.id)} className="p-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg"><Trash2 size={14}/></button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── ASIGNACIONES ──────────────────────────────────────────────────────────────
const LS_ASIGNACIONES = 'cfg_asignaciones';
const LS_DOCENTES_KEY = 'ie_docentes';
const GRADOS_SISTEMA  = ['1°','2°','3°','4°','5°'];
const SECCIONES_SISTEMA = ['A','B','C','D','E','F','G','H'];

export interface Asignacion {
  id: string;
  docenteId: string;
  cursoId: string;
  grados: string[];
  secciones: string[];
}

function AsignacionesSection() {
  const [asignaciones, setAsignaciones] = useState<Asignacion[]>([]);
  const [docentes, setDocentes]         = useState<any[]>([]);
  const [cursos, setCursos]             = useState<Curso[]>([]);

  useEffect(() => {
    // Cargar asignaciones: intentar Turso primero, fallback a localStorage
    (async () => {
      let asigs: Asignacion[] = [];
      const localAsigs = lsGet(LS_ASIGNACIONES, []);
      try {
        asigs = await getAsignacionesTurso();
        // Si Turso está vacío pero localStorage tiene datos, subirlos a Turso
        if (asigs.length === 0 && localAsigs.length > 0) {
          syncToTurso('asignaciones', localAsigs);
          asigs = localAsigs;
        }
      } catch {
        asigs = localAsigs;
      }
      setAsignaciones(asigs);
    })();
    setDocentes(lsGet(LS_DOCENTES_KEY, []));
    setCursos(lsGet(LS_CURSOS, []));
  }, []);
  const [msg, setMsg] = useState<{tipo:'ok'|'err';texto:string}|null>(null);

  // Modal nueva asignación
  const [showModal, setShowModal] = useState(false);
  const [editAsig, setEditAsig]   = useState<Asignacion|null>(null);
  const [form, setForm] = useState<{ docenteId:string; cursoId:string; grados:string[]; secciones:string[] }>({
    docenteId:'', cursoId:'', grados:[], secciones:[]
  });

  const flash = (tipo:'ok'|'err', texto:string) => { setMsg({tipo,texto}); setTimeout(()=>setMsg(null),3500); };
  const guardarLS = (data: Asignacion[]) => {
    lsSet(LS_ASIGNACIONES, data);
    setAsignaciones(data);
    syncToTurso('asignaciones', data);
  };

  const abrirNueva = () => {
    setEditAsig(null);
    setForm({ docenteId:'', cursoId:'', grados:[], secciones:[] });
    setShowModal(true);
  };

  const abrirEditar = (a: Asignacion) => {
    setEditAsig(a);
    setForm({ docenteId:a.docenteId, cursoId:a.cursoId, grados:[...a.grados], secciones:[...a.secciones] });
    setShowModal(true);
  };

  const toggleArr = (arr: string[], val: string) =>
    arr.includes(val) ? arr.filter(x=>x!==val) : [...arr, val];

  const guardar = () => {
    if (!form.docenteId) return flash('err','Selecciona un docente');
    if (!form.cursoId)   return flash('err','Selecciona un curso');
    if (form.grados.length===0) return flash('err','Selecciona al menos un grado');
    if (form.secciones.length===0) return flash('err','Selecciona al menos una sección');
    if (editAsig) {
      guardarLS(asignaciones.map(a=>a.id===editAsig.id?{...editAsig,...form}:a));
      flash('ok','Asignación actualizada');
    } else {
      guardarLS([...asignaciones, { id:'asig-'+Date.now(), ...form }]);
      flash('ok','Asignación creada');
    }
    setShowModal(false);
  };

  const eliminar = (id: string) => {
    if (!confirm('¿Eliminar esta asignación?')) return;
    guardarLS(asignaciones.filter(a=>a.id!==id));
    flash('ok','Eliminado');
  };

  const nombreDocente = (id: string) => {
    const d = docentes.find(d=>d.id===id);
    return d ? (d.apellidos_nombres||d.nombre||'Docente') : 'Desconocido';
  };
  const nombreCurso = (id: string) => cursos.find(c=>c.id===id)?.nombre || 'Curso';

  const exportarParaDocentes = () => {
    const alumnos = lsGet('ie_alumnos', []);
    const data = {
      tipo: 'asignacion_docente',
      fecha: new Date().toISOString(),
      asignaciones,
      alumnos,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `asignaciones_docentes_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    flash('ok', 'Archivo descargado. Envíalo por WhatsApp a cada docente.');
  };

  const subirAsignacionesYAlumnos = async () => {
    flash('ok', '📤 Subiendo asignaciones y alumnos...');
    try {
      const alumnos = lsGet('ie_alumnos', []);
      const asigs = lsGet('cfg_asignaciones', []);
      await syncToTurso('asignaciones', asigs);
      await syncToTurso('alumnos', alumnos);
      flash('ok', `✅ Subidos: ${asigs.length} asignaciones, ${alumnos.length} alumnos`);
    } catch (e: any) {
      flash('err', '❌ Error subiendo: ' + e.message);
    }
  };

  return (
    <div className={sectionCls}>
        <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-white font-bold text-lg flex items-center gap-2">🏫 Asignaciones Docente-Curso</h2>
        <div className="flex gap-2">
          {asignaciones.length > 0 && (
            <>
              <button onClick={subirAsignacionesYAlumnos} className="flex items-center gap-2 px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg font-bold text-sm">
                <RefreshCw size={15}/> Subir a la nube
              </button>
              <button onClick={exportarParaDocentes} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-sm">
                <Download size={15}/> Exportar para docentes
              </button>
            </>
          )}
          <button onClick={abrirNueva} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold text-sm">
            <Plus size={15}/> Nueva asignación
          </button>
        </div>
      </div>
      {msg && <Msg tipo={msg.tipo} texto={msg.texto}/>}

      {docentes.length===0 && (
        <p className="text-amber-400 text-sm bg-amber-500/10 border border-amber-500/30 rounded-lg px-4 py-3">
          ⚠️ No hay docentes registrados. Ve al módulo <strong>Docentes</strong> para agregarlos primero.
        </p>
      )}
      {cursos.length===0 && (
        <p className="text-amber-400 text-sm bg-amber-500/10 border border-amber-500/30 rounded-lg px-4 py-3">
          ⚠️ No hay cursos. Créalos en la pestaña <strong>Cursos</strong> primero.
        </p>
      )}

      {asignaciones.length===0 ? (
        <p className="text-slate-500 text-sm text-center py-6">Sin asignaciones. Usa "Nueva asignación" para vincular docentes con cursos y secciones.</p>
      ) : (
        <div className="space-y-3">
          {asignaciones.map(a=>(
            <div key={a.id} className="bg-slate-700/50 rounded-xl px-4 py-3 flex items-start gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-white font-bold text-sm truncate">{nombreDocente(a.docenteId)}</p>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-300 rounded-full text-xs font-bold">📖 {nombreCurso(a.cursoId)}</span>
                  {a.grados.map(g=>(
                    <span key={g} className="px-2 py-0.5 bg-slate-600 text-slate-300 rounded-full text-xs">{g}</span>
                  ))}
                  <span className="text-slate-500 text-xs">·</span>
                  {a.secciones.map(s=>(
                    <span key={s} className="px-2 py-0.5 bg-slate-600 text-slate-300 rounded-full text-xs">"{s}"</span>
                  ))}
                </div>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button onClick={()=>abrirEditar(a)} className="p-1.5 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg"><Edit2 size={13}/></button>
                <button onClick={()=>eliminar(a.id)} className="p-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg"><Trash2 size={13}/></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-indigo-500/30 rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700 flex-shrink-0">
              <h3 className="text-white font-bold text-lg">{editAsig?'Editar asignación':'Nueva asignación'}</h3>
              <button onClick={()=>setShowModal(false)}><X size={18} className="text-slate-400"/></button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

              {/* Docente */}
              <div>
                <label className="block text-xs text-slate-400 mb-1.5 font-medium uppercase tracking-wide">Docente *</label>
                <select value={form.docenteId} onChange={e=>setForm({...form,docenteId:e.target.value})} className={inputCls}>
                  <option value="">Seleccionar docente...</option>
                  {docentes.map(d=>(
                    <option key={d.id} value={d.id}>{d.apellidos_nombres||d.nombre}</option>
                  ))}
                </select>
              </div>

              {/* Curso */}
              <div>
                <label className="block text-xs text-slate-400 mb-1.5 font-medium uppercase tracking-wide">Curso / Área *</label>
                <select value={form.cursoId} onChange={e=>setForm({...form,cursoId:e.target.value})} className={inputCls}>
                  <option value="">Seleccionar curso...</option>
                  {cursos.map(c=>(
                    <option key={c.id} value={c.id}>{c.nombre}</option>
                  ))}
                </select>
              </div>

              {/* Grados */}
              <div>
                <label className="block text-xs text-slate-400 mb-2 font-medium uppercase tracking-wide">Grados que enseña *</label>
                <div className="flex gap-2 flex-wrap">
                  {GRADOS_SISTEMA.map(g=>(
                    <button key={g} onClick={()=>setForm(f=>({...f,grados:toggleArr(f.grados,g)}))}
                      className={`px-4 py-2 rounded-xl text-sm font-bold border-2 transition-all ${form.grados.includes(g)?'bg-indigo-600 border-indigo-400 text-white':'bg-slate-700 border-slate-600 text-slate-400 hover:border-slate-500'}`}>
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              {/* Secciones */}
              <div>
                <label className="block text-xs text-slate-400 mb-2 font-medium uppercase tracking-wide">Secciones *</label>
                <div className="flex gap-2 flex-wrap">
                  {SECCIONES_SISTEMA.map(s=>(
                    <button key={s} onClick={()=>setForm(f=>({...f,secciones:toggleArr(f.secciones,s)}))}
                      className={`w-12 py-2 rounded-xl text-sm font-bold border-2 transition-all ${form.secciones.includes(s)?'bg-emerald-600 border-emerald-400 text-white':'bg-slate-700 border-slate-600 text-slate-400 hover:border-slate-500'}`}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Resumen */}
              {form.docenteId && form.cursoId && form.grados.length>0 && form.secciones.length>0 && (
                <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-xl px-4 py-3 text-xs text-indigo-300">
                  <p className="font-bold mb-1">✅ Resumen de asignación:</p>
                  <p><strong>{nombreDocente(form.docenteId)}</strong> enseña <strong>{nombreCurso(form.cursoId)}</strong></p>
                  <p>Grados: {form.grados.join(', ')} · Secciones: {form.secciones.join(', ')}</p>
                </div>
              )}
            </div>
            <div className="flex gap-3 px-6 py-4 border-t border-slate-700 flex-shrink-0">
              <button onClick={guardar} className="flex-1 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold rounded-xl text-sm hover:opacity-90">
                {editAsig?'Guardar cambios':'Crear asignación'}
              </button>
              <button onClick={()=>setShowModal(false)} className="px-5 py-2.5 bg-slate-700 text-white rounded-xl hover:bg-slate-600 text-sm">Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── API STATUS ────────────────────────────────────────────────────────────────
function ApiStatusSection() {
  const [checking, setChecking] = useState(false);
  const [tursoOk, setTursoOk] = useState<boolean | null>(null);
  const [dbSize, setDbSize] = useState<string>('—');
  const [lastCheck, setLastCheck] = useState<string>('');
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{ ok: boolean; message: string; syncedTypes: string[] } | null>(null);
  const [diag, setDiag] = useState<any | null>(null);
  const [diagLoading, setDiagLoading] = useState(false);
  const [cleaning, setCleaning] = useState(false);
  const [cleanResult, setCleanResult] = useState<any | null>(null);
  const [dupes, setDupes] = useState<any | null>(null);
  const [dupesLoading, setDupesLoading] = useState(false);
  const storage = getStorageStats();
  const cloud = isSyncedToCloud();

  // Cuentas del sistema
  const usuarios: any[] = (() => {
    try { return JSON.parse(localStorage.getItem('sistema_usuarios') || '[]'); } catch { return []; }
  })();
  const alumnos: any[] = (() => {
    try { return JSON.parse(localStorage.getItem('ie_alumnos') || '[]'); } catch { return []; }
  })();
  const docentes: any[] = (() => {
    try { return JSON.parse(localStorage.getItem('ie_docentes') || '[]'); } catch { return []; }
  })();

  const checkTurso = async () => {
    setChecking(true);
    setTursoOk(null);
    try {
      const res = await fetch('/api/sync?size=1', { signal: AbortSignal.timeout(5000) });
      if (res.ok) {
        const data = await res.json();
        setTursoOk(true);
        setDbSize(data.dbSize ? `${(data.dbSize / 1024).toFixed(1)} KB` : 'OK');
      } else {
        setTursoOk(false);
      }
    } catch {
      setTursoOk(false);
    } finally {
      setChecking(false);
      setLastCheck(new Date().toLocaleTimeString('es-PE'));
    }
  };

  const handleSyncAll = async () => {
    setSyncing(true);
    setSyncResult(null);
    try {
      const result = await syncAllToTurso();
      setSyncResult(result);
    } catch {
      setSyncResult({ ok: false, message: 'Error inesperado al sincronizar', syncedTypes: [] });
    } finally {
      setSyncing(false);
    }
  };

  const diagnosticarTurso = async () => {
    setDiagLoading(true);
    setDiag(null);
    try {
      const res = await fetch('/api/sync?accion=diagnostico', { signal: AbortSignal.timeout(10000) });
      const data = await res.json();
      if (data.ok) setDiag(data);
      else setDiag({ error: data.error || 'Error desconocido' });
    } catch (e: any) {
      setDiag({ error: e.message });
    } finally {
      setDiagLoading(false);
    }
  };

  const limpiarTabla = async (accion: string, dias: number) => {
    setCleaning(true);
    setCleanResult(null);
    try {
      const res = await fetch(`/api/sync?accion=${accion}&dias=${dias}`, { signal: AbortSignal.timeout(10000) });
      const data = await res.json();
      setCleanResult(data);
      diagnosticarTurso();
    } catch (e: any) {
      setCleanResult({ error: e.message });
    } finally {
      setCleaning(false);
    }
  };

  const vacuumTurso = async () => {
    setCleaning(true);
    setCleanResult(null);
    try {
      const res = await fetch('/api/sync?accion=vacuum', { signal: AbortSignal.timeout(30000) });
      const data = await res.json();
      setCleanResult(data);
      if (data.dbSizeKB) setDbSize(`${data.dbSizeKB} KB`);
      diagnosticarTurso();
    } catch (e: any) {
      setCleanResult({ error: e.message });
    } finally {
      setCleaning(false);
    }
  };

  const detectarDuplicados = async () => {
    setDupesLoading(true);
    setDupes(null);
    try {
      const res = await fetch('/api/sync?accion=duplicados', { signal: AbortSignal.timeout(10000) });
      const data = await res.json();
      if (data.ok) setDupes(data.duplicados);
      else setDupes({ error: data.error });
    } catch (e: any) {
      setDupes({ error: e.message });
    } finally {
      setDupesLoading(false);
    }
  };

  const deduplicar = async (tabla: string) => {
    setCleaning(true);
    setCleanResult(null);
    try {
      const res = await fetch(`/api/sync?accion=deduplicar&tabla=${tabla}`, { signal: AbortSignal.timeout(30000) });
      const data = await res.json();
      setCleanResult(data);
      detectarDuplicados();
      diagnosticarTurso();
    } catch (e: any) {
      setCleanResult({ error: e.message });
    } finally {
      setCleaning(false);
    }
  };

  return (
    <div className="space-y-6">

      {/* Sync Manual */}
      <div className={sectionCls}>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-white font-bold text-base flex items-center gap-2">
              <RefreshCw size={18} className="text-green-400" />
              Sincronización Manual a la Nube
            </h2>
            <p className="text-slate-400 text-xs mt-1">
              Sube todo el contenido del almacenamiento local a Turso DB ahora mismo.
            </p>
          </div>
          <button onClick={handleSyncAll} disabled={syncing}
            className="flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white rounded-lg text-sm font-bold transition-all">
            <RefreshCw size={14} className={syncing ? 'animate-spin' : ''} />
            {syncing ? 'Sincronizando...' : '🚀 Sincronizar Todo Ahora'}
          </button>
        </div>

        {syncResult && (
          <div className={`rounded-xl p-4 border ${syncResult.ok ? 'bg-green-500/15 border-green-500/30' : 'bg-yellow-500/15 border-yellow-500/30'}`}>
            <p className={`font-bold text-sm mb-2 ${syncResult.ok ? 'text-green-300' : 'text-yellow-300'}`}>
              {syncResult.ok ? '✅' : '⚠️'} {syncResult.message}
            </p>
            {syncResult.syncedTypes.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {syncResult.syncedTypes.map((t, i) => (
                  <span key={i} className="text-xs px-2 py-0.5 bg-slate-700/60 text-slate-300 rounded-full border border-slate-600/40 font-mono">
                    {t}
                  </span>
                ))}
              </div>
            )}
            {!cloud && (
              <p className="text-slate-400 text-xs mt-2 italic">
                Nota: En modo desarrollo, el sync está simulado. El push real a Turso ocurre en producción (Vercel).
              </p>
            )}
          </div>
        )}
      </div>

      {/* Estado Turso DB */}
      <div className={sectionCls}>
        <div className="flex items-center justify-between">
          <h2 className="text-white font-bold text-base flex items-center gap-2">
            <Database size={18} className="text-indigo-400" />
            Estado de Turso DB (Nube)
          </h2>
          <button onClick={checkTurso} disabled={checking}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-all">
            <RefreshCw size={13} className={checking ? 'animate-spin' : ''} />
            {checking ? 'Verificando...' : 'Verificar Conexión'}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Estado general */}
          <div className="bg-slate-700/40 rounded-xl p-4 flex flex-col gap-2">
            <p className="text-xs text-slate-400 uppercase font-medium">Modo actual</p>
            <div className={`flex items-center gap-2 font-bold ${cloud ? 'text-green-400' : 'text-yellow-400'}`}>
              {cloud ? <Wifi size={18} /> : <WifiOff size={18} />}
              {cloud ? 'PRODUCCIÓN' : 'DESARROLLO LOCAL'}
            </div>
            <p className="text-xs text-slate-500">
              {cloud ? 'Sync automático con Turso activo' : 'Solo localStorage — sin sync'}
            </p>
          </div>

          {/* Turso ping */}
          <div className="bg-slate-700/40 rounded-xl p-4 flex flex-col gap-2">
            <p className="text-xs text-slate-400 uppercase font-medium">Turso API</p>
            {tursoOk === null && (
              <p className="text-slate-500 text-sm">{lastCheck ? 'Sin resultado' : 'Sin verificar aún'}</p>
            )}
            {tursoOk === true && (
              <div className="flex items-center gap-2 text-green-400 font-bold">
                <Check size={16} /> Conectado · {dbSize}
              </div>
            )}
            {tursoOk === false && (
              <div className="flex items-center gap-2 text-red-400 font-bold">
                <X size={16} /> Sin conexión
              </div>
            )}
            {lastCheck && <p className="text-xs text-slate-500">Última verificación: {lastCheck}</p>}
          </div>

          {/* Storage local */}
          <div className="bg-slate-700/40 rounded-xl p-4 flex flex-col gap-2">
            <p className="text-xs text-slate-400 uppercase font-medium">Storage Local</p>
            <p className="text-white font-bold text-lg">{storage.totalKB} KB</p>
            <div className="h-2 bg-slate-600 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${storage.percentage > 80 ? 'bg-red-500' : storage.percentage > 50 ? 'bg-yellow-500' : 'bg-green-500'}`}
                style={{ width: `${Math.min(storage.percentage, 100)}%` }}
              />
            </div>
            <p className="text-xs text-slate-500">{storage.percentage}% de 5 MB usado</p>
          </div>
        </div>

        {/* Detalle por tabla */}
        <div>
          <p className="text-xs text-slate-400 uppercase font-medium mb-3">Datos almacenados</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Alumnos', count: alumnos.length, key: 'ie_alumnos', color: 'text-cyan-400' },
              { label: 'Docentes', count: docentes.length, key: 'ie_docentes', color: 'text-indigo-400' },
              { label: 'Usuarios', count: usuarios.length, key: 'sistema_usuarios', color: 'text-purple-400' },
              { label: 'Asistencia', count: (() => { try { return JSON.parse(localStorage.getItem('ie_asistencia')||'[]').length; } catch { return 0; } })(), key: 'ie_asistencia', color: 'text-green-400' },
              { label: 'Calificativos', count: (() => { try { return JSON.parse(localStorage.getItem('ie_calificativos_v2')||'[]').length; } catch { return 0; } })(), key: 'ie_calificativos_v2', color: 'text-yellow-400' },
              { label: 'Normas', count: (() => { try { return JSON.parse(localStorage.getItem('cfg_normas_convivencia')||'[]').length; } catch { return 0; } })(), key: 'cfg_normas_convivencia', color: 'text-pink-400' },
              { label: 'Reg. Normas', count: (() => { try { return JSON.parse(localStorage.getItem('ie_registros_normas')||'[]').length; } catch { return 0; } })(), key: 'ie_registros_normas', color: 'text-orange-400' },
              { label: 'Columnas eval.', count: (() => { try { return JSON.parse(localStorage.getItem('cal_columnas')||'[]').length; } catch { return 0; } })(), key: 'cal_columnas', color: 'text-teal-400' },
            ].map(item => (
              <div key={item.key} className="bg-slate-700/40 rounded-lg px-3 py-2">
                <p className="text-xs text-slate-400">{item.label}</p>
                <p className={`text-xl font-black ${item.color}`}>{item.count}</p>
                <p className="text-[10px] text-slate-600 truncate">{storage.breakdown[item.key] ? `${Math.round(storage.breakdown[item.key]/1024*10)/10} KB` : '0 KB'}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Diagnóstico y Limpieza Turso */}
      <div className={sectionCls}>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-white font-bold text-base flex items-center gap-2">
              <AlertCircle size={18} className="text-amber-400" />
              Diagnóstico y Limpieza de Turso
            </h2>
            <p className="text-slate-400 text-xs mt-1">
              Revisa qué tablas ocupan espacio, detecta duplicados y limpia datos innecesarios.
            </p>
          </div>
          <div className="flex gap-2">
            <button onClick={detectarDuplicados} disabled={dupesLoading}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-all">
              <RefreshCw size={13} className={dupesLoading ? 'animate-spin' : ''} />
              {dupesLoading ? 'Analizando...' : '⚠️ Buscar Duplicados'}
            </button>
            <button onClick={diagnosticarTurso} disabled={diagLoading}
              className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-all">
              <RefreshCw size={13} className={diagLoading ? 'animate-spin' : ''} />
              {diagLoading ? 'Analizando...' : '🔍 Diagnosticar'}
            </button>
          </div>
        </div>

        {/* Duplicados */}
        {dupes && !dupes.error && (
          <div className="space-y-3 mt-4">
            <p className="text-xs text-red-400 uppercase font-bold">Duplicados detectados</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {(['alumnos','apoderados','columnas'] as const).map((t) => {
                const d = dupes[t];
                if (!d || d.duplicados === 0) return null;
                return (
                  <div key={t} className="bg-red-500/10 border border-red-500/30 rounded-xl p-3">
                    <p className="text-xs text-red-300 uppercase font-bold">{t}</p>
                    <p className="text-white font-bold text-lg">{d.total} total</p>
                    <p className="text-red-400 text-sm font-bold">{d.duplicados} duplicados</p>
                    <p className="text-slate-400 text-[10px]">Deberían ser ~{d.unicos}</p>
                    <button onClick={() => deduplicar(t)} disabled={cleaning}
                      className="mt-2 w-full px-2 py-1.5 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white rounded-lg text-[10px] font-bold transition-all">
                      {cleaning ? 'Procesando...' : `🗑️ Eliminar ${d.duplicados} duplicados`}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {diag && !diag.error && (
          <div className="space-y-4 mt-4">
            <div className="flex items-center gap-3">
              <div className="bg-slate-700/40 rounded-xl p-3 flex-1">
                <p className="text-xs text-slate-400 uppercase">Tamaño total</p>
                <p className="text-white font-bold text-lg">{diag.dbSizeKB} KB</p>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {Object.entries(diag.conteos as Record<string,number>).map(([tabla, count]) => (
                <div key={tabla} className={`bg-slate-700/40 rounded-lg px-3 py-2 ${count > 500 ? 'border border-red-500/30' : count > 100 ? 'border border-yellow-500/30' : ''}`}>
                  <p className="text-[10px] text-slate-400 uppercase truncate">{tabla.replace(/_/g,' ')}</p>
                  <p className={`text-lg font-black ${count > 500 ? 'text-red-400' : count > 100 ? 'text-yellow-400' : 'text-cyan-400'}`}>{count}</p>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              <button onClick={() => limpiarTabla('limpiar_historial', 7)} disabled={cleaning}
                className="px-3 py-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-all">
                🗑️ Borrar historial &gt; 7 días
              </button>
              <button onClick={() => limpiarTabla('limpiar_auditoria', 7)} disabled={cleaning}
                className="px-3 py-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-all">
                🗑️ Borrar auditoría &gt; 7 días
              </button>
              <button onClick={() => limpiarTabla('limpiar_historial', 30)} disabled={cleaning}
                className="px-3 py-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-all">
                🗑️ Borrar historial &gt; 30 días
              </button>
              <button onClick={() => limpiarTabla('limpiar_auditoria', 30)} disabled={cleaning}
                className="px-3 py-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-all">
                🗑️ Borrar auditoría &gt; 30 días
              </button>
            </div>

            <div className="rounded-lg p-3 bg-slate-700/30 border border-slate-600/40 text-xs text-slate-400">
              <strong className="text-slate-300">Nota sobre VACUUM:</strong> Turso no permite ejecutar VACUUM manualmente desde SQL. El espacio liberado por los duplicados eliminados se reutilizará automáticamente en futuras inserciones. Si necesitas reducir el tamaño físico, contacta al soporte de Turso.
            </div>
          </div>
        )}

        {cleanResult && (
          <div className={`rounded-xl p-3 border text-xs ${cleanResult.ok ? 'bg-green-500/15 border-green-500/30 text-green-300' : 'bg-red-500/15 border-red-500/30 text-red-300'}`}>
            {cleanResult.ok
              ? `✅ ${cleanResult.mensaje || 'Operación completada'}${cleanResult.eliminados !== undefined ? ` · ${cleanResult.eliminados} registros eliminados` : ''}${cleanResult.dbSizeKB !== undefined ? ` · Tamaño ahora: ${cleanResult.dbSizeKB} KB` : ''}`
              : `❌ Error: ${cleanResult.error || 'Desconocido'}`}
          </div>
        )}
      </div>

      {/* Cuentas del sistema */}
      <div className={sectionCls}>
        <h2 className="text-white font-bold text-base flex items-center gap-2">
          <Key size={18} className="text-amber-400" />
          Cuentas de Acceso al Sistema
        </h2>

        {/* Sin cuentas demo */}
        <div className="rounded-xl bg-slate-700/30 border border-slate-600/40 px-4 py-3">
          <p className="text-xs text-slate-400 uppercase font-medium mb-1">Cuentas Demo</p>
          <p className="text-slate-300 text-sm">
            Las cuentas demo han sido <span className="text-amber-400 font-semibold">deshabilitadas</span>.
            Todos los accesos son con credenciales reales registradas en el sistema.
          </p>
          <p className="text-slate-500 text-xs mt-1">Para crear nuevas cuentas, usa <strong className="text-slate-300">Panel Admin → Gestionar Usuarios</strong>.</p>
        </div>

        {/* Cuentas registradas en localStorage */}
        <div>
          <p className="text-xs text-slate-400 uppercase mb-3 font-medium">
            Cuentas Creadas en Sistema ({usuarios.length})
          </p>
          {usuarios.length === 0 ? (
            <p className="text-slate-500 text-sm py-3 text-center">
              Sin cuentas adicionales creadas. Ve a <strong className="text-slate-300">Panel Admin → Gestionar Usuarios</strong> para agregar.
            </p>
          ) : (
            <div className="space-y-2">
              {usuarios.map((u: any) => (
                <div key={u.id} className="flex items-center gap-3 bg-slate-700/30 rounded-lg px-4 py-2.5">
                  <span className="text-xs font-bold w-24 flex-shrink-0 text-indigo-300 capitalize">{u.rol || u.role}</span>
                  <span className="text-white text-sm flex-1 font-mono truncate">{u.email}</span>
                  <span className={`text-xs flex items-center gap-1 ${u.estado === 'activo' || !u.estado ? 'text-green-400' : 'text-red-400'}`}>
                    {u.estado === 'activo' || !u.estado ? <><Check size={11}/> Activo</> : <><X size={11}/> Inactivo</>}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* API Keys */}
        <div>
          <p className="text-xs text-slate-400 uppercase mb-3 font-medium flex items-center gap-2">
            <Server size={12} /> Variables de Entorno / API Keys
          </p>
          <div className="space-y-2">
            {[
              {
                key: 'TURSO_CONNECTION_URL',
                label: 'Turso DB URL',
                value: import.meta.env.VITE_API_URL || 'No expuesta al cliente',
                ok: true,
              },
              {
                key: 'GEMINI_API_KEY',
                label: 'Gemini AI Key',
                value: 'Configurada en .env (servidor)',
                ok: true,
              },
              {
                key: 'JWT_SECRET',
                label: 'JWT Secret',
                value: 'Configurado en backend',
                ok: true,
              },
            ].map(item => (
              <div key={item.key} className="flex items-center gap-3 bg-slate-700/30 rounded-lg px-4 py-2.5">
                <code className="text-xs text-amber-300 w-40 flex-shrink-0 font-mono">{item.key}</code>
                <span className="text-slate-300 text-sm flex-1">{item.label}</span>
                <span className="text-slate-400 text-xs">{item.value}</span>
                <span className={`text-xs flex items-center gap-1 ${item.ok ? 'text-green-400' : 'text-red-400'}`}>
                  {item.ok ? <><Check size={11}/> OK</> : <><X size={11}/> Falta</>}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── MAIN ──────────────────────────────────────────────────────────────────────
export default function ConfiguracionScreen() {
  const [tab, setTab] = useState<'anios'|'bimestres'|'instrumentos'|'unidades'|'competencias'|'cursos'|'asignaciones'|'api'>('bimestres');

  const tabs = [
    { id: 'anios',         label: '🗓️ Años', icon: '📆' },
    { id: 'bimestres',    label: '📅 Bimestres', icon: '📅' },
    { id: 'instrumentos', label: '📋 Instrumentos', icon: '📋' },
    { id: 'unidades',     label: '📚 Unidades', icon: '📚' },
    { id: 'competencias', label: '🎯 Competencias', icon: '🎯' },
    { id: 'cursos',       label: '📖 Cursos', icon: '📖' },
    { id: 'asignaciones', label: '🏫 Asignaciones', icon: '🏫' },
    { id: 'api',          label: '🌐 API & Cuentas', icon: '🌐' },
  ] as const;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 overflow-hidden">
      {/* Fondo animado */}
      <div className="fixed inset-0 -z-50">
        <div className="absolute inset-0 bg-gradient-cyber opacity-60"></div>
      </div>

      <div className="relative z-10 max-w-full">
        <HeaderElegante
          icon={Settings}
          title="EDUGEST CONFIGURACIÓN"
          subtitle="Configuración académica del sistema"
        />

        {/* Selector visual de secciones en grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 mb-8">
          {tabs.map((t, i) => (
            <motion.button
              key={t.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => setTab(t.id)}
              className={`relative p-4 rounded-xl transition-all border-2 ${
                tab === t.id
                  ? 'bg-gradient-to-br from-cyan-500/30 to-blue-500/30 border-cyan-400 shadow-lg shadow-cyan-500/20'
                  : 'bg-slate-800/50 border-slate-700 hover:border-cyan-400/50 hover:bg-slate-800/80'
              }`}
            >
              <div className="text-2xl mb-1">{t.icon}</div>
              <div className="text-xs font-bold text-white text-center line-clamp-2">{t.label.split(' ').slice(1).join(' ')}</div>
              {tab === t.id && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 rounded-xl bg-cyan-400/10"
                  transition={{ type: 'spring', duration: 0.3 }}
                />
              )}
            </motion.button>
          ))}
        </div>

        <div className="space-y-6">
          {tab === 'anios'         && <AniosSection />}
          {tab === 'bimestres'    && <BimestresSection />}
          {tab === 'instrumentos' && <InstrumentosSection />}
          {tab === 'unidades'     && <UnidadesSection />}
          {tab === 'competencias' && <CompetenciasSection />}
          {tab === 'cursos'       && <CursosSection />}
          {tab === 'asignaciones' && <AsignacionesSection />}
          {tab === 'api'          && <ApiStatusSection />}
        </div>
      </div>
    </div>
  );
}
