import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Trash2, Edit2, Search, Upload, Download, X, Check, AlertCircle, RefreshCw, ChevronDown, ChevronUp, Phone } from 'lucide-react';
import { guardarAlumnos } from '../services/dataService';

interface Apoderado {
  apellidos_nombres: string;
  dni: string;
  celular: string;
}

interface Alumno {
  id: string;
  apellidos_nombres: string;
  dni: string;
  fecha_nacimiento: string;
  edad: number;
  sexo: string;
  grado: string;
  seccion: string;
  madre?: Apoderado;
  padre?: Apoderado;
  madre_nombres?: string;
  madre_dni?: string;
  madre_celular?: string;
  padre_nombres?: string;
  padre_dni?: string;
  padre_celular?: string;
}

const GRADOS = ['1°', '2°', '3°', '4°', '5°'];
const SECCIONES = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
const SEXOS = ['Masculino', 'Femenino'];

// ── API helper ────────────────────────────────────────────────────────────────
function getToken() { return localStorage.getItem('auth_token') || ''; }

async function api(path: string, method = 'GET', body?: object) {
  // En desarrollo local → localStorage; en producción → API real
  if (!import.meta.env.PROD) {
    return localApi(path, method, body);
  }
  const res = await fetch(path, {
    method,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error');
  return data;
}

// ── Fallback localStorage (desarrollo local) ──────────────────────────────────
const LS_KEY = 'ie_alumnos';
function lsCargar(): Alumno[] {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || '[]'); } catch { return []; }
}
function lsGuardar(data: Alumno[]) { 
  localStorage.setItem(LS_KEY, JSON.stringify(data));
  guardarAlumnos(data); // Sincronizar con Turso
}

function localApi(path: string, method: string, body?: object): any {
  const todos = lsCargar();
  if (method === 'GET') return todos;
  if (method === 'POST') {
    const b = body as any;
    if (todos.some(a => a.dni === b.dni)) throw new Error('DNI ya registrado');
    const nuevo = { ...b, id: 'al-' + Date.now() };
    lsGuardar([...todos, nuevo]);
    return { ok: true, id: nuevo.id };
  }
  if (method === 'PUT') {
    const id = path.split('id=')[1];
    const idx = todos.findIndex(a => a.id === id);
    if (idx >= 0) { todos[idx] = { ...todos[idx], ...(body as any) }; lsGuardar(todos); }
    return { ok: true };
  }
  if (method === 'DELETE') {
    const id = path.split('id=')[1];
    lsGuardar(todos.filter(a => a.id !== id));
    return { ok: true };
  }
}

function calcularEdad(fecha: string): number {
  if (!fecha) return 0;
  const hoy = new Date(); const nac = new Date(fecha);
  let edad = hoy.getFullYear() - nac.getFullYear();
  if (hoy.getMonth() - nac.getMonth() < 0 || (hoy.getMonth() - nac.getMonth() === 0 && hoy.getDate() < nac.getDate())) edad--;
  return edad;
}

const inputCls = "w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-green-500 text-sm";

function ApoderadoForm({ label, data, onChange }: { label: string; data: Apoderado; onChange: (d: Apoderado) => void }) {
  return (
    <div className="bg-slate-700/50 rounded-xl p-4 space-y-3">
      <p className="text-xs font-bold text-slate-300 uppercase tracking-wide">{label}</p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="sm:col-span-3">
          <label className="block text-xs text-slate-400 mb-1">Apellidos y Nombres</label>
          <input type="text" value={data.apellidos_nombres}
            onChange={e => onChange({ ...data, apellidos_nombres: e.target.value })}
            placeholder="GARCÍA TORRES, María Elena" className={inputCls} />
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1">DNI</label>
          <input type="text" maxLength={8} value={data.dni}
            onChange={e => onChange({ ...data, dni: e.target.value.replace(/\D/g, '') })}
            placeholder="12345678" className={inputCls} />
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1">N° Celular</label>
          <input type="text" maxLength={9} value={data.celular}
            onChange={e => onChange({ ...data, celular: e.target.value.replace(/\D/g, '') })}
            placeholder="987654321" className={inputCls} />
        </div>
      </div>
    </div>
  );
}

const emptyApod: Apoderado = { apellidos_nombres: '', dni: '', celular: '' };
const emptyForm = {
  id: '', apellidos_nombres: '', dni: '', fecha_nacimiento: '',
  edad: 0, sexo: '', grado: '', seccion: '',
  madre: { ...emptyApod }, padre: { ...emptyApod },
};

export default function AlumnosScreen() {
  const [alumnos, setAlumnos] = useState<Alumno[]>([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [filtroGrado, setFiltroGrado] = useState('');
  const [filtroSeccion, setFiltroSeccion] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editando, setEditando] = useState<Alumno | null>(null);
  const [expandido, setExpandido] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [eliminando, setEliminando] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ tipo: 'ok' | 'err'; texto: string } | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [showImport, setShowImport] = useState(false);
  const [importRows, setImportRows] = useState<any[]>([]);
  const [importando, setImportando] = useState(false);
  const [importResult, setImportResult] = useState<{ ok: number; err: number } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const mostrar = (tipo: 'ok' | 'err', texto: string) => {
    setMsg({ tipo, texto }); setTimeout(() => setMsg(null), 3500);
  };

  const cargar = async () => {
    setCargando(true);
    try {
      const data = await api('/api/alumnos');
      const lista = Array.isArray(data) ? data : [];
      setAlumnos(lista.map((a: any) => ({
        ...a,
        madre_nombres: a.madre_nombres || a.madre?.apellidos_nombres || '',
        madre_dni:     a.madre_dni     || a.madre?.dni || '',
        madre_celular: a.madre_celular || a.madre?.celular || '',
        padre_nombres: a.padre_nombres || a.padre?.apellidos_nombres || '',
        padre_dni:     a.padre_dni     || a.padre?.dni || '',
        padre_celular: a.padre_celular || a.padre?.celular || '',
      })));
    } catch { mostrar('err', 'Error al cargar alumnos'); }
    finally { setCargando(false); }
  };

  useEffect(() => { cargar(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.apellidos_nombres || !form.dni || !form.fecha_nacimiento || !form.sexo || !form.grado || !form.seccion)
      return mostrar('err', 'Completa los campos obligatorios');
    setGuardando(true);
    try {
      const payload = { ...form, edad: calcularEdad(form.fecha_nacimiento) };
      if (editando) {
        await api(`/api/alumnos?id=${editando.id}`, 'PUT', payload);
        mostrar('ok', 'Alumno actualizado');
      } else {
        await api('/api/alumnos', 'POST', payload);
        mostrar('ok', 'Alumno registrado');
      }
      setShowForm(false); setEditando(null); setForm(emptyForm);
      await cargar();
    } catch (e: any) { mostrar('err', e.message); }
    finally { setGuardando(false); }
  };

  const handleEliminar = async (id: string) => {
    if (!confirm('¿Eliminar este alumno?')) return;
    setEliminando(id);
    try {
      await api(`/api/alumnos?id=${id}`, 'DELETE');
      mostrar('ok', 'Alumno eliminado');
      await cargar();
    } catch (e: any) { mostrar('err', e.message); }
    finally { setEliminando(null); }
  };

  const handleEditar = (a: Alumno) => {
    setEditando(a);
    setForm({
      ...a,
      madre: { apellidos_nombres: a.madre_nombres || '', dni: a.madre_dni || '', celular: a.madre_celular || '' },
      padre: { apellidos_nombres: a.padre_nombres || '', dni: a.padre_dni || '', celular: a.padre_celular || '' },
    });
    setShowForm(true);
  };

  const handleArchivo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    try {
      // @ts-ignore
      const XLSX = await import('https://cdn.sheetjs.com/xlsx-0.20.2/package/xlsx.mjs');
      const buffer = await file.arrayBuffer();
      const wb = XLSX.read(new Uint8Array(buffer), { type: 'array' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const allRows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

      let hIdx = 0;
      for (let i = 0; i < Math.min(allRows.length, 5); i++) {
        const r = allRows[i];
        if (r.some((c: any) => String(c).toUpperCase().includes('APELLIDO') || String(c).toUpperCase().includes('DNI'))) {
          hIdx = i; break;
        }
      }
      const headers: string[] = allRows[hIdx].map((h: any) => String(h).trim().toUpperCase());
      const dataRows = allRows.slice(hIdx + 1).filter((r: any[]) => r.some((c: any) => c !== ''));

      const colVal = (row: any[], ...terms: string[]): string => {
        for (const t of terms) {
          const i = headers.findIndex(h => h.includes(t.toUpperCase()));
          if (i >= 0 && row[i] !== undefined && row[i] !== '') return String(row[i]).trim();
        }
        return '';
      };

      const toDate = (val: any): string => {
        if (!val) return '';
        if (typeof val === 'number') {
          const d = new Date(Math.round((val - 25569) * 86400 * 1000));
          return d.toISOString().split('T')[0];
        }
        if (val instanceof Date) return val.toISOString().split('T')[0];
        return String(val).trim();
      };

      const gradoMap: Record<string, string> = {
        'PRIMERO': '1°', 'SEGUNDO': '2°', 'TERCERO': '3°',
        'CUARTO': '4°', 'QUINTO': '5°', 'SEXTO': '6°',
      };

      const rows = dataRows.map((r: any[]) => ({
        apellidos_nombres: colVal(r, 'APELLIDOS Y NOMBRES', 'APELLIDO'),
        dni:               colVal(r, 'N° DNI DEL ALUMNO', 'DNI DEL ALUMNO', 'DNI'),
        fecha_nacimiento:  toDate(r[headers.findIndex(h => h.includes('NACIMIENTO'))]),
        sexo:              colVal(r, 'SEXO'),
        grado:             gradoMap[colVal(r, 'GRADO DE ESTUDIOS', 'GRADO').toUpperCase()] || colVal(r, 'GRADO DE ESTUDIOS', 'GRADO'),
        seccion:           colVal(r, 'SECCI').replace(/^\d+/, '') || colVal(r, 'SECCI'),
        madre: {
          apellidos_nombres: colVal(r, 'NOMBRES DE LA MADRE', 'MADRE'),
          dni:               colVal(r, 'DNI MADRE'),
          celular:           colVal(r, 'CELULAR  DE LA MADRE', 'CELULAR DE LA MADRE'),
        },
        padre: {
          apellidos_nombres: colVal(r, 'NOMBRES DEL PADRE', 'PADRE'),
          dni:               colVal(r, 'DNI PADRE'),
          celular:           colVal(r, 'CELULAR DEL PADRE'),
        },
      }));
      setImportRows(rows.filter((r: any) => r.apellidos_nombres && r.dni));
      setImportResult(null);
      setShowImport(true);
    } catch { mostrar('err', 'Error leyendo el archivo Excel'); }
  };

  const handleImportar = async () => {
    setImportando(true);
    let ok = 0, err = 0;
    for (const r of importRows) {
      try {
        await api('/api/alumnos', 'POST', { ...r, edad: calcularEdad(r.fecha_nacimiento) });
        ok++;
      } catch { err++; }
    }
    setImportResult({ ok, err });
    setImportando(false);
    await cargar();
  };

  const descargarPlantilla = async () => {
    // @ts-ignore
    const XLSX = await import('https://cdn.sheetjs.com/xlsx-0.20.2/package/xlsx.mjs');
    const data = [
      { 'APELLIDOS Y NOMBRES': 'MENDEZ FLORES, Carlos Alberto', 'DNI': '75123456', 'FECHA DE NACIMIENTO': '2010-05-12', 'SEXO': 'Masculino', 'GRADO': '3°', 'SECCI': 'A', 'NOMBRES DE LA MADRE': 'FLORES RÍOS, Ana María', 'DNI MADRE': '41234567', 'CELULAR DE LA MADRE': '987654321', 'NOMBRES DEL PADRE': 'MENDEZ TORRES, Pedro Luis', 'DNI PADRE': '40123456', 'CELULAR DEL PADRE': '976543210' },
    ];
    const ws = XLSX.utils.json_to_sheet(data);
    ws['!cols'] = Array(12).fill({ wch: 28 });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Alumnos');
    XLSX.writeFile(wb, 'plantilla_alumnos.xlsx');
  };

  const filtrados = alumnos.filter(a => {
    const b = busqueda.toLowerCase();
    const matchB = a.apellidos_nombres.toLowerCase().includes(b) || a.dni.includes(b) ||
      (a.madre_nombres || '').toLowerCase().includes(b) || (a.padre_nombres || '').toLowerCase().includes(b);
    const matchG = !filtroGrado || a.grado === filtroGrado;
    const matchS = !filtroSeccion || a.seccion === filtroSeccion;
    return matchB && matchG && matchS;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="sticky top-0 z-40 backdrop-blur-xl bg-slate-900/80 border-b border-green-500/20">
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-3xl font-black text-white">👨‍🎓 Alumnos</h1>
            <p className="text-green-400/70 text-sm mt-0.5">{alumnos.length} alumnos registrados</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button onClick={cargar} className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm">
              <RefreshCw size={14} /> Actualizar
            </button>
            <button onClick={descargarPlantilla} className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm">
              <Download size={14} /> Plantilla Excel
            </button>
            <label className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm cursor-pointer">
              <Upload size={14} /> Importar Excel
              <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleArchivo} />
            </label>
            <button onClick={() => { setEditando(null); setForm(emptyForm); setShowForm(!showForm); }}
              className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold rounded-lg text-sm hover:opacity-90">
              <Plus size={16} /> Nuevo Alumno
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-5">
        <AnimatePresence>
          {msg && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm ${msg.tipo === 'ok' ? 'bg-green-500/20 border border-green-500/40 text-green-300' : 'bg-red-500/20 border border-red-500/40 text-red-300'}`}>
              {msg.tipo === 'ok' ? <Check size={16} /> : <AlertCircle size={16} />} {msg.texto}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Modal importación */}
        <AnimatePresence>
          {showImport && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
              <div className="bg-slate-800 border border-green-500/30 rounded-2xl w-full max-w-4xl max-h-[80vh] flex flex-col">
                <div className="flex items-center justify-between p-6 border-b border-slate-700">
                  <h2 className="text-xl font-bold text-white">📥 Importar {importRows.length} alumnos</h2>
                  <button onClick={() => { setShowImport(false); setImportRows([]); setImportResult(null); }}>
                    <X size={20} className="text-slate-400 hover:text-white" />
                  </button>
                </div>
                {importResult ? (
                  <div className="p-8 text-center space-y-4">
                    <div className="text-5xl">{importResult.err === 0 ? '🎉' : '⚠️'}</div>
                    <p className="text-white text-xl font-bold">Importación completada</p>
                    <div className="flex justify-center gap-8">
                      <div><div className="text-3xl font-black text-green-400">{importResult.ok}</div><div className="text-slate-400 text-sm">registrados</div></div>
                      <div><div className="text-3xl font-black text-red-400">{importResult.err}</div><div className="text-slate-400 text-sm">errores (DNI duplicado)</div></div>
                    </div>
                    <button onClick={() => { setShowImport(false); setImportRows([]); setImportResult(null); }}
                      className="mt-2 px-6 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg font-bold">Cerrar</button>
                  </div>
                ) : (
                  <>
                    <div className="overflow-auto flex-1 p-4">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="text-slate-400 border-b border-slate-700">
                            {['Apellidos y Nombres', 'DNI', 'Grado', 'Sección', 'Madre', 'Padre'].map(h => (
                              <th key={h} className="text-left pb-2 pr-3 font-medium">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700/50">
                          {importRows.map((r, i) => (
                            <tr key={i}>
                              <td className="py-1.5 pr-3 text-white">{r.apellidos_nombres}</td>
                              <td className="py-1.5 pr-3 text-slate-300">{r.dni}</td>
                              <td className="py-1.5 pr-3 text-slate-300">{r.grado}</td>
                              <td className="py-1.5 pr-3 text-slate-300">{r.seccion}</td>
                              <td className="py-1.5 pr-3 text-slate-300">{r.madre?.apellidos_nombres || '—'}</td>
                              <td className="py-1.5 pr-3 text-slate-300">{r.padre?.apellidos_nombres || '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="p-4 border-t border-slate-700 flex gap-3">
                      <button onClick={handleImportar} disabled={importando}
                        className="flex-1 py-2.5 bg-gradient-to-r from-emerald-500 to-green-600 text-white font-bold rounded-lg disabled:opacity-60 flex items-center justify-center gap-2">
                        {importando ? <><RefreshCw size={15} className="animate-spin" />Importando...</> : `✓ Importar ${importRows.length} alumnos`}
                      </button>
                      <button onClick={() => { setShowImport(false); setImportRows([]); }}
                        className="px-5 py-2.5 bg-slate-700 text-white rounded-lg hover:bg-slate-600">Cancelar</button>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Formulario */}
        {showForm && (
          <div className="bg-slate-800 border border-green-500/30 rounded-xl p-6 space-y-5">
            <h2 className="text-lg font-bold text-white">{editando ? '✏️ Editar Alumno' : '➕ Nuevo Alumno'}</h2>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3">Datos del Alumno</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs text-slate-400 mb-1">Apellidos y Nombres <span className="text-red-400">*</span></label>
                    <input type="text" value={form.apellidos_nombres} onChange={e => setForm({ ...form, apellidos_nombres: e.target.value })} placeholder="MENDEZ FLORES, Carlos Alberto" className={inputCls} />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">DNI <span className="text-red-400">*</span></label>
                    <input type="text" maxLength={8} value={form.dni} onChange={e => setForm({ ...form, dni: e.target.value.replace(/\D/g, '') })} placeholder="75123456" className={inputCls} />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Fecha de Nacimiento <span className="text-red-400">*</span></label>
                    <input type="date" value={form.fecha_nacimiento} onChange={e => setForm({ ...form, fecha_nacimiento: e.target.value })} className={inputCls} />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Edad</label>
                    <input type="text" readOnly value={form.fecha_nacimiento ? calcularEdad(form.fecha_nacimiento) + ' años' : '—'} className={inputCls + ' opacity-60 cursor-not-allowed'} />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Sexo <span className="text-red-400">*</span></label>
                    <select value={form.sexo} onChange={e => setForm({ ...form, sexo: e.target.value })} className={inputCls}>
                      <option value="">Seleccionar...</option>
                      {SEXOS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Grado <span className="text-red-400">*</span></label>
                    <select value={form.grado} onChange={e => setForm({ ...form, grado: e.target.value })} className={inputCls}>
                      <option value="">Seleccionar...</option>
                      {GRADOS.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Sección <span className="text-red-400">*</span></label>
                    <select value={form.seccion} onChange={e => setForm({ ...form, seccion: e.target.value })} className={inputCls}>
                      <option value="">Seleccionar...</option>
                      {SECCIONES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <ApoderadoForm label="👩 Datos de la Madre" data={form.madre || emptyApod} onChange={madre => setForm({ ...form, madre })} />
                <ApoderadoForm label="👨 Datos del Padre" data={form.padre || emptyApod} onChange={padre => setForm({ ...form, padre })} />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={guardando}
                  className="flex-1 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold rounded-lg disabled:opacity-60 flex items-center justify-center gap-2 text-sm">
                  {guardando ? <><RefreshCw size={14} className="animate-spin" />Guardando...</> : `✓ ${editando ? 'Actualizar' : 'Registrar'} Alumno`}
                </button>
                <button type="button" onClick={() => { setShowForm(false); setEditando(null); }} className="px-6 py-2.5 bg-slate-700 text-white rounded-lg hover:bg-slate-600 text-sm">Cancelar</button>
              </div>
            </form>
          </div>
        )}

        {/* Filtros */}
        <div className="flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={17} />
            <input type="text" placeholder="Buscar por nombre, DNI o apoderado..." value={busqueda} onChange={e => setBusqueda(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-green-500 text-sm" />
          </div>
          <select value={filtroGrado} onChange={e => setFiltroGrado(e.target.value)} className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-green-500">
            <option value="">Todos los grados</option>
            {GRADOS.map(g => <option key={g} value={g}>{g} Grado</option>)}
          </select>
          <select value={filtroSeccion} onChange={e => setFiltroSeccion(e.target.value)} className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-green-500">
            <option value="">Todas las secciones</option>
            {SECCIONES.map(s => <option key={s} value={s}>Sección {s}</option>)}
          </select>
        </div>

        {/* Stats */}
        <div className="flex gap-3 flex-wrap text-xs">
          {GRADOS.map(g => {
            const count = alumnos.filter(a => a.grado === g).length;
            if (count === 0) return null;
            return (
              <button key={g} onClick={() => setFiltroGrado(filtroGrado === g ? '' : g)}
                className={`px-3 py-1.5 rounded-lg border transition-all ${filtroGrado === g ? 'bg-green-500/20 border-green-500/50 text-green-300' : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'}`}>
                {g} Grado · <span className="font-bold">{count}</span>
              </button>
            );
          })}
        </div>

        {/* Lista */}
        {cargando ? (
          <div className="text-center py-16">
            <RefreshCw size={30} className="animate-spin text-green-400 mx-auto mb-3" />
            <p className="text-slate-400">Cargando alumnos...</p>
          </div>
        ) : filtrados.length === 0 ? (
          <div className="text-center py-16 text-slate-500">No se encontraron alumnos</div>
        ) : (
          <div className="space-y-2">
            {filtrados.map((a, i) => (
              <motion.div key={a.id} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.02 }}
                className="bg-slate-800/70 border border-slate-700/60 hover:border-green-500/30 rounded-xl overflow-hidden transition-all">
                <div className="px-5 py-4 flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0 ${a.sexo === 'Femenino' ? 'bg-gradient-to-br from-pink-500 to-rose-600' : 'bg-gradient-to-br from-green-500 to-emerald-600'}`}>
                    {a.apellidos_nombres.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold truncate">{a.apellidos_nombres}</p>
                    <div className="flex gap-3 text-xs text-slate-400 flex-wrap mt-0.5">
                      <span>DNI: {a.dni}</span>
                      <span className="text-green-400 font-medium">{a.grado} Grado "{a.seccion}"</span>
                      <span>{a.edad} años</span>
                      <span>{a.sexo}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 items-center">
                    <button onClick={() => setExpandido(expandido === a.id ? null : a.id)} className="p-2 bg-slate-700/60 hover:bg-slate-600 rounded-lg text-slate-400">
                      {expandido === a.id ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                    </button>
                    <button onClick={() => handleEditar(a)} className="p-2 bg-blue-500/15 hover:bg-blue-500/30 rounded-lg text-blue-400"><Edit2 size={15} /></button>
                    <button onClick={() => handleEliminar(a.id)} disabled={eliminando === a.id} className="p-2 bg-red-500/15 hover:bg-red-500/30 rounded-lg text-red-400 disabled:opacity-50">
                      {eliminando === a.id ? <RefreshCw size={15} className="animate-spin" /> : <Trash2 size={15} />}
                    </button>
                  </div>
                </div>
                <AnimatePresence>
                  {expandido === a.id && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                      className="border-t border-slate-700/50 px-5 py-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      <div className="space-y-1">
                        <p className="text-slate-500 font-medium uppercase tracking-wide">👩 Madre</p>
                        {a.madre_nombres ? (<><p className="text-white">{a.madre_nombres}</p><p className="text-slate-400">DNI: {a.madre_dni || '—'}</p>{a.madre_celular && <a href={`tel:${a.madre_celular}`} className="flex items-center gap-1 text-green-400"><Phone size={11} /> {a.madre_celular}</a>}</>) : <p className="text-slate-600">No registrada</p>}
                      </div>
                      <div className="space-y-1">
                        <p className="text-slate-500 font-medium uppercase tracking-wide">👨 Padre</p>
                        {a.padre_nombres ? (<><p className="text-white">{a.padre_nombres}</p><p className="text-slate-400">DNI: {a.padre_dni || '—'}</p>{a.padre_celular && <a href={`tel:${a.padre_celular}`} className="flex items-center gap-1 text-green-400"><Phone size={11} /> {a.padre_celular}</a>}</>) : <p className="text-slate-600">No registrado</p>}
                      </div>
                      <div className="sm:col-span-2 border-t border-slate-700/50 pt-3 grid grid-cols-3 gap-3">
                        <div><p className="text-slate-500">F. Nacimiento</p><p className="text-white">{a.fecha_nacimiento}</p></div>
                        <div><p className="text-slate-500">Edad</p><p className="text-white">{a.edad} años</p></div>
                        <div><p className="text-slate-500">Sexo</p><p className="text-white">{a.sexo}</p></div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
