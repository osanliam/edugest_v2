import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Check, X, Save, RefreshCw, AlertCircle } from 'lucide-react';

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
  tipo: 'instrumento' | 'examen';
  calificativo: 'ABC' | 'AD_A_B_C';
  descripcion: string;
}

interface Unidad {
  id: string;
  numero: number;
  nombre: string;
  bimestreId: string;
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
    { v: 'instrumento', l: 'Instrumento de evaluación' },
    { v: 'examen', l: 'Examen' },
  ];
  const CAL = [
    { v: 'ABC', l: 'C / B / A (sin AD manual)' },
    { v: 'AD_A_B_C', l: 'C / B / A / AD (con AD manual)' },
  ];

  return (
    <div className={sectionCls}>
      <div className="flex items-center justify-between">
        <h2 className="text-white font-bold text-base flex items-center gap-2">📋 Instrumentos de Evaluación</h2>
        <button onClick={() => setForm({ id:'', nombre:'', tipo:'instrumento', calificativo:'AD_A_B_C', descripcion:'' })}
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

  useEffect(() => {
    setLista(lsGet(LS.unidades));
    setBimestres(lsGet(LS.bimestres));
  }, []);

  const guardar = () => {
    if (!form?.nombre || !form.numero) return setMsg({tipo:'err',texto:'Completa número y nombre'});
    const todos = [...lista];
    const idx = todos.findIndex(u => u.id === form.id);
    if (idx >= 0) todos[idx] = form;
    else todos.push({ ...form, id: 'uni-' + Date.now() });
    lsSet(LS.unidades, todos);
    setLista(todos);
    setForm(null);
    setMsg({tipo:'ok',texto:'Unidad guardada'});
    setTimeout(() => setMsg(null), 2500);
  };

  const eliminar = (id: string) => {
    const todos = lista.filter(u => u.id !== id);
    lsSet(LS.unidades, todos);
    setLista(todos);
  };

  return (
    <div className={sectionCls}>
      <div className="flex items-center justify-between">
        <h2 className="text-white font-bold text-base flex items-center gap-2">📚 Unidades Didácticas</h2>
        <button onClick={() => setForm({ id:'', numero: lista.length + 1, nombre:'', bimestreId:'' })}
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
              <input type="number" min={1} value={form.numero} onChange={e => setForm({...form, numero: Number(e.target.value)})} className={inputCls} />
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
          <div className="flex gap-2">
            <button onClick={guardar} className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5">
              <Save size={13} /> Guardar
            </button>
            <button onClick={() => setForm(null)} className="px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded-lg text-xs">Cancelar</button>
          </div>
        </div>
      )}
      <div className="space-y-2">
        {lista.length === 0 && <p className="text-slate-500 text-sm text-center py-4">Sin unidades configuradas</p>}
        {[...lista].sort((a,b) => a.numero - b.numero).map(u => {
          const bim = bimestres.find(b => b.id === u.bimestreId);
          return (
            <div key={u.id} className="flex items-center justify-between bg-slate-700/40 rounded-lg px-4 py-3">
              <div>
                <span className="text-slate-400 text-xs font-bold mr-2">Unidad {u.numero}</span>
                <span className="text-white text-sm font-medium">{u.nombre}</span>
                {bim && <span className="ml-2 text-xs text-indigo-400">{bim.nombre}</span>}
              </div>
              <div className="flex gap-2">
                <button onClick={() => setForm({...u})} className="p-1.5 bg-blue-500/20 hover:bg-blue-500/30 rounded text-blue-400"><Edit2 size={12} /></button>
                <button onClick={() => eliminar(u.id)} className="p-1.5 bg-red-500/20 hover:bg-red-500/30 rounded text-red-400"><Trash2 size={12} /></button>
              </div>
            </div>
          );
        })}
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

// ── MAIN ──────────────────────────────────────────────────────────────────────
export default function ConfiguracionScreen() {
  const [tab, setTab] = useState<'anios'|'bimestres'|'instrumentos'|'unidades'|'competencias'>('bimestres');

  const tabs = [
    { id: 'anios',        label: '🗓️ Años' },
    { id: 'bimestres',   label: '📅 Bimestres' },
    { id: 'instrumentos',label: '📋 Instrumentos' },
    { id: 'unidades',    label: '📚 Unidades' },
    { id: 'competencias',label: '🎯 Competencias' },
  ] as const;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="sticky top-0 z-40 backdrop-blur-xl bg-slate-900/80 border-b border-indigo-500/20">
        <div className="max-w-4xl mx-auto px-6 py-5">
          <h1 className="text-3xl font-black text-white">⚙️ Configuración Académica</h1>
          <p className="text-indigo-400/70 text-sm mt-0.5">Bimestres, instrumentos, unidades, años y competencias</p>
        </div>
        <div className="max-w-4xl mx-auto px-6 flex gap-1 overflow-x-auto pb-px">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-all ${tab === t.id ? 'border-indigo-400 text-indigo-300' : 'border-transparent text-slate-400 hover:text-slate-200'}`}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {tab === 'anios' && <AniosSection />}
        {tab === 'bimestres' && <BimestresSection />}
        {tab === 'instrumentos' && <InstrumentosSection />}
        {tab === 'unidades' && <UnidadesSection />}
        {tab === 'competencias' && <CompetenciasSection />}
      </div>
    </div>
  );
}
