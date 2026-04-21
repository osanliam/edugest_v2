import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Trash2, Edit2, Search, Upload, Download, X, Check, AlertCircle, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';

interface Docente {
  id: string;
  apellidos_nombres: string;
  dni: string;
  genero: string;
  fecha_nacimiento: string;
  celular: string;
  cargo: string;
  email: string;
  user_id?: string;
}

const GENEROS = ['Masculino', 'Femenino'];
const CARGOS = [
  'Docente de Aula', 'Director', 'Subdirector', 'Auxiliar de Educación',
  'Coordinador Académico', 'Tutor', 'Docente de Educación Física',
  'Docente de Arte', 'Docente de Inglés', 'Psicólogo(a)', 'Otro'
];

function getToken() { return localStorage.getItem('auth_token') || ''; }

async function apiCall(path: string, method = 'GET', body?: object) {
  const res = await fetch(path, {
    method,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error');
  return data;
}

function FormField({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-400 mb-1.5">
        {label}{required && <span className="text-red-400 ml-1">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputCls = "w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 text-sm";

export default function DocentesScreen() {
  const [docentes, setDocentes] = useState<Docente[]>([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editando, setEditando] = useState<Docente | null>(null);
  const [expandido, setExpandido] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [eliminando, setEliminando] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ tipo: 'ok' | 'err'; texto: string } | null>(null);
  const [showImport, setShowImport] = useState(false);
  const [importRows, setImportRows] = useState<Partial<Docente>[]>([]);
  const [importando, setImportando] = useState(false);
  const [importResult, setImportResult] = useState<{ ok: number; err: number } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const emptyForm: Docente = { id: '', apellidos_nombres: '', dni: '', genero: '', fecha_nacimiento: '', celular: '', cargo: '', email: '' };
  const [form, setForm] = useState<Docente>(emptyForm);

  useEffect(() => { cargar(); }, []);

  const cargar = async () => {
    setCargando(true);
    try {
      const data = await apiCall('/api/docentes');
      setDocentes(data || []);
    } catch { mostrar('err', 'No se pudo cargar docentes'); }
    finally { setCargando(false); }
  };

  const mostrar = (tipo: 'ok' | 'err', texto: string) => {
    setMsg({ tipo, texto });
    setTimeout(() => setMsg(null), 3500);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.apellidos_nombres || !form.dni || !form.genero || !form.fecha_nacimiento)
      return mostrar('err', 'Completa los campos obligatorios');
    setGuardando(true);
    try {
      if (editando) {
        await apiCall(`/api/docentes?id=${editando.id}`, 'PUT', form);
        mostrar('ok', 'Docente actualizado');
      } else {
        await apiCall('/api/docentes', 'POST', form);
        mostrar('ok', 'Docente registrado');
      }
      setShowForm(false); setEditando(null); setForm(emptyForm);
      await cargar();
    } catch (e: any) { mostrar('err', e.message); }
    finally { setGuardando(false); }
  };

  const handleEliminar = async (id: string) => {
    if (!confirm('¿Eliminar este docente?')) return;
    setEliminando(id);
    try {
      await apiCall(`/api/docentes?id=${id}`, 'DELETE');
      mostrar('ok', 'Docente eliminado');
      await cargar();
    } catch (e: any) { mostrar('err', e.message); }
    finally { setEliminando(null); }
  };

  // ── Importación ───────────────────────────────────────────────────
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
      // Leer todo como arrays de filas
      const allRows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

      // Buscar la fila que contiene los headers reales (puede estar en fila 0, 1 o 2)
      let hIdx = 0;
      for (let i = 0; i < Math.min(allRows.length, 5); i++) {
        const r = allRows[i];
        if (r.some((c: any) => String(c).toUpperCase().includes('APELLIDO') || String(c).toUpperCase() === 'DNI')) {
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

      const rows: Partial<Docente>[] = dataRows.map((r: any[]) => ({
        apellidos_nombres: colVal(r, 'APELLIDO'),
        dni:               colVal(r, 'DNI'),
        genero:            colVal(r, 'GENERO', 'GÉNERO', 'SEXO'),
        fecha_nacimiento:  toDate(r[headers.findIndex(h => h.includes('NACIMIENTO'))]),
        celular:           colVal(r, 'CELULAR', 'NÚMERO', 'NUMERO'),
        cargo:             colVal(r, 'CARGO', 'REALIZA'),
        email:             colVal(r, 'EMAIL', 'CORREO'),
      }));
      setImportRows(rows.filter(r => r.apellidos_nombres && r.dni));
      setImportResult(null);
      setShowImport(true);
    } catch { mostrar('err', 'Error leyendo el archivo Excel'); }
  };

  const handleImportar = async () => {
    setImportando(true);
    let ok = 0, err = 0;
    for (const r of importRows) {
      try {
        await apiCall('/api/docentes', 'POST', r);
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
      {
        'APELLIDOS Y NOMBRES': 'PÉREZ GARCÍA, Juan Carlos',
        'DNI': '12345678',
        'GENERO': 'Masculino',
        'FECHA DE NACIMIENTO': '1985-03-15',
        'N° CELULAR': '987654321',
        'CARGO': 'Docente de Aula',
        'EMAIL': 'juan.perez@escuela.edu',
      },
      {
        'APELLIDOS Y NOMBRES': 'LÓPEZ TORRES, María Elena',
        'DNI': '87654321',
        'GENERO': 'Femenino',
        'FECHA DE NACIMIENTO': '1990-07-22',
        'N° CELULAR': '912345678',
        'CARGO': 'Coordinador Académico',
        'EMAIL': 'maria.lopez@escuela.edu',
      },
    ];
    const ws = XLSX.utils.json_to_sheet(data);
    ws['!cols'] = [{ wch: 35 }, { wch: 12 }, { wch: 12 }, { wch: 20 }, { wch: 14 }, { wch: 25 }, { wch: 30 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Docentes');
    XLSX.writeFile(wb, 'plantilla_docentes.xlsx');
  };

  const filtrados = docentes.filter(d =>
    d.apellidos_nombres.toLowerCase().includes(busqueda.toLowerCase()) ||
    d.dni.includes(busqueda) ||
    d.cargo?.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">

      {/* Header */}
      <div className="sticky top-0 z-40 backdrop-blur-xl bg-slate-900/80 border-b border-blue-500/20">
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-3xl font-black text-white">👨‍🏫 Docentes</h1>
            <p className="text-blue-400/70 text-sm mt-0.5">{docentes.length} docentes registrados</p>
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
              className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-blue-500 to-cyan-600 text-white font-bold rounded-lg text-sm hover:opacity-90">
              <Plus size={16} /> Nuevo Docente
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-5">

        {/* Mensajes */}
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
              <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }}
                className="bg-slate-800 border border-blue-500/30 rounded-2xl w-full max-w-3xl max-h-[80vh] flex flex-col">
                <div className="flex items-center justify-between p-6 border-b border-slate-700">
                  <h2 className="text-xl font-bold text-white">📥 Importar {importRows.length} docentes</h2>
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
                      <div><div className="text-3xl font-black text-red-400">{importResult.err}</div><div className="text-slate-400 text-sm">errores (DNI duplicado u otro)</div></div>
                    </div>
                    <button onClick={() => { setShowImport(false); setImportRows([]); setImportResult(null); }}
                      className="mt-2 px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold">Cerrar</button>
                  </div>
                ) : (
                  <>
                    <div className="overflow-auto flex-1 p-4">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="text-slate-400 border-b border-slate-700">
                            {['Apellidos y Nombres', 'DNI', 'Género', 'F. Nacimiento', 'Celular', 'Cargo'].map(h => (
                              <th key={h} className="text-left pb-2 pr-3 font-medium">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700/50">
                          {importRows.map((r, i) => (
                            <tr key={i}>
                              <td className="py-1.5 pr-3 text-white">{r.apellidos_nombres}</td>
                              <td className="py-1.5 pr-3 text-slate-300">{r.dni}</td>
                              <td className="py-1.5 pr-3 text-slate-300">{r.genero}</td>
                              <td className="py-1.5 pr-3 text-slate-300">{r.fecha_nacimiento}</td>
                              <td className="py-1.5 pr-3 text-slate-300">{r.celular}</td>
                              <td className="py-1.5 pr-3 text-slate-300">{r.cargo}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="p-4 border-t border-slate-700 flex gap-3">
                      <button onClick={handleImportar} disabled={importando}
                        className="flex-1 py-2.5 bg-gradient-to-r from-emerald-500 to-green-600 text-white font-bold rounded-lg disabled:opacity-60 flex items-center justify-center gap-2">
                        {importando ? <><RefreshCw size={15} className="animate-spin" /> Importando...</> : `✓ Importar ${importRows.length} docentes`}
                      </button>
                      <button onClick={() => { setShowImport(false); setImportRows([]); }}
                        className="px-5 py-2.5 bg-slate-700 text-white rounded-lg hover:bg-slate-600">Cancelar</button>
                    </div>
                  </>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Formulario */}
        <AnimatePresence>
          {showForm && (
            <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="bg-slate-800 border border-blue-500/30 rounded-xl p-6">
              <h2 className="text-lg font-bold text-white mb-5">{editando ? '✏️ Editar Docente' : '➕ Nuevo Docente'}</h2>
              <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="sm:col-span-2 lg:col-span-2">
                  <FormField label="Apellidos y Nombres" required>
                    <input type="text" value={form.apellidos_nombres}
                      onChange={e => setForm({ ...form, apellidos_nombres: e.target.value })}
                      placeholder="PÉREZ GARCÍA, Juan Carlos" className={inputCls} />
                  </FormField>
                </div>
                <FormField label="DNI" required>
                  <input type="text" maxLength={8} value={form.dni}
                    onChange={e => setForm({ ...form, dni: e.target.value.replace(/\D/g, '') })}
                    placeholder="12345678" className={inputCls} />
                </FormField>
                <FormField label="Género" required>
                  <select value={form.genero} onChange={e => setForm({ ...form, genero: e.target.value })} className={inputCls}>
                    <option value="">Seleccionar...</option>
                    {GENEROS.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </FormField>
                <FormField label="Fecha de Nacimiento" required>
                  <input type="date" value={form.fecha_nacimiento}
                    onChange={e => setForm({ ...form, fecha_nacimiento: e.target.value })} className={inputCls} />
                </FormField>
                <FormField label="N° Celular">
                  <input type="text" maxLength={9} value={form.celular}
                    onChange={e => setForm({ ...form, celular: e.target.value.replace(/\D/g, '') })}
                    placeholder="987654321" className={inputCls} />
                </FormField>
                <FormField label="Cargo en la IE">
                  <select value={form.cargo} onChange={e => setForm({ ...form, cargo: e.target.value })} className={inputCls}>
                    <option value="">Seleccionar...</option>
                    {CARGOS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </FormField>
                <FormField label="Email">
                  <input type="email" value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                    placeholder="juan@manuelfidencio.edu.pe" className={inputCls} />
                </FormField>
                <div className="sm:col-span-2 lg:col-span-3 flex gap-3 pt-2">
                  <button type="submit" disabled={guardando}
                    className="flex-1 py-2.5 bg-gradient-to-r from-blue-500 to-cyan-600 text-white font-bold rounded-lg disabled:opacity-60 flex items-center justify-center gap-2 text-sm">
                    {guardando ? <><RefreshCw size={14} className="animate-spin" />Guardando...</> : `✓ ${editando ? 'Actualizar' : 'Registrar'} Docente`}
                  </button>
                  <button type="button" onClick={() => { setShowForm(false); setEditando(null); }}
                    className="px-6 py-2.5 bg-slate-700 text-white rounded-lg hover:bg-slate-600 text-sm">Cancelar</button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Búsqueda */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={17} />
          <input type="text" placeholder="Buscar por nombre, DNI o cargo..." value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 text-sm" />
        </div>

        {/* Lista */}
        {cargando ? (
          <div className="text-center py-16">
            <RefreshCw size={30} className="animate-spin text-blue-400 mx-auto mb-3" />
            <p className="text-slate-400">Cargando docentes...</p>
          </div>
        ) : filtrados.length === 0 ? (
          <div className="text-center py-16 text-slate-500">No se encontraron docentes</div>
        ) : (
          <div className="space-y-2">
            {filtrados.map((d, i) => (
              <motion.div key={d.id} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
                className="bg-slate-800/70 border border-slate-700/60 hover:border-blue-500/30 rounded-xl overflow-hidden transition-all">
                <div className="px-5 py-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                    {d.apellidos_nombres.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold truncate">{d.apellidos_nombres}</p>
                    <div className="flex gap-3 text-xs text-slate-400 flex-wrap mt-0.5">
                      <span>DNI: {d.dni}</span>
                      <span>{d.genero}</span>
                      {d.cargo && <span className="text-blue-400">{d.cargo}</span>}
                      {d.celular && <span>📱 {d.celular}</span>}
                    </div>
                  </div>
                  <div className="flex gap-2 items-center">
                    <button onClick={() => setExpandido(expandido === d.id ? null : d.id)}
                      className="p-2 bg-slate-700/60 hover:bg-slate-600 rounded-lg text-slate-400 transition-all">
                      {expandido === d.id ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                    </button>
                    <button onClick={() => { setEditando(d); setForm(d); setShowForm(true); }}
                      className="p-2 bg-blue-500/15 hover:bg-blue-500/30 rounded-lg text-blue-400 transition-all">
                      <Edit2 size={15} />
                    </button>
                    <button onClick={() => handleEliminar(d.id)} disabled={eliminando === d.id}
                      className="p-2 bg-red-500/15 hover:bg-red-500/30 rounded-lg text-red-400 transition-all disabled:opacity-50">
                      {eliminando === d.id ? <RefreshCw size={15} className="animate-spin" /> : <Trash2 size={15} />}
                    </button>
                  </div>
                </div>
                <AnimatePresence>
                  {expandido === d.id && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                      className="border-t border-slate-700/50 px-5 py-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      {[
                        { label: 'Fecha Nacimiento', value: d.fecha_nacimiento },
                        { label: 'Email', value: d.email || '—' },
                        { label: 'Celular', value: d.celular || '—' },
                        { label: 'Cargo', value: d.cargo || '—' },
                      ].map(({ label, value }) => (
                        <div key={label}>
                          <p className="text-slate-500 mb-0.5">{label}</p>
                          <p className="text-white">{value}</p>
                        </div>
                      ))}
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
