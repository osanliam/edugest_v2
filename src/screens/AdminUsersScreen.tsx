import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Trash2, Edit2, Search, Eye, EyeOff, Upload, Download, X, Check, AlertCircle, RefreshCw, UserX, UserCheck, Key } from 'lucide-react';

interface Usuario {
  id: string;
  nombre: string;
  email: string;
  contraseña: string;
  rol: 'admin' | 'director' | 'subdirector' | 'teacher' | 'parent' | 'student';
  activo: boolean;
  creado: string;
  docenteId?: string; // referencia al docente en ie_docentes
}

const ROL_CONFIG: Record<string, { label: string; color: string }> = {
  admin:       { label: '👑 Administrador', color: 'from-purple-500 to-pink-600' },
  director:    { label: '🏛️ Director',      color: 'from-red-500 to-rose-600' },
  subdirector: { label: '📋 Subdirector',   color: 'from-orange-500 to-amber-600' },
  teacher:     { label: '👨‍🏫 Docente',     color: 'from-blue-500 to-cyan-600' },
  parent:      { label: '👨‍👩‍👧 Apoderado', color: 'from-green-500 to-emerald-600' },
  student:     { label: '👨‍🎓 Estudiante',  color: 'from-yellow-500 to-orange-600' },
};

const LS_KEY = 'sistema_usuarios';
const LS_DOCENTES = 'ie_docentes';

function lsCargar(): Usuario[] {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || '[]'); } catch { return []; }
}
function lsGuardar(data: Usuario[]) {
  localStorage.setItem(LS_KEY, JSON.stringify(data));
}
function lsDocentes(): any[] {
  try { return JSON.parse(localStorage.getItem(LS_DOCENTES) || '[]'); } catch { return []; }
}

// Parsear CSV simple
function parseCSV(text: string): Partial<Usuario>[] {
  const lines = text.trim().split('\n').map(l => l.trim()).filter(Boolean);
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/['"]/g, ''));
  return lines.slice(1).map(line => {
    const values = line.split(',').map(v => v.trim().replace(/['"]/g, ''));
    const obj: any = {};
    headers.forEach((h, i) => { obj[h] = values[i] || ''; });
    return {
      nombre: obj.nombre || obj.name || '',
      email: obj.email || obj.correo || '',
      contraseña: obj.contraseña || obj.contrasena || obj.password || obj.clave || '',
      rol: obj.rol || obj.role || obj.tipo || 'student',
    };
  });
}

export default function AdminUsersScreen() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [docentes, setDocentes] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [filtroRol, setFiltroRol] = useState('todos');
  const [showForm, setShowForm] = useState(false);
  const [editando, setEditando] = useState<Usuario | null>(null);
  const [mostrarPassword, setMostrarPassword] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [eliminando, setEliminando] = useState<string | null>(null);

  // Modal asignar usuario a docente
  const [showAsignar, setShowAsignar] = useState(false);
  const [docenteSelec, setDocenteSelec] = useState<any | null>(null);
  const [asignarForm, setAsignarForm] = useState({ email: '', contraseña: '', confirmar: '' });

  // Importación
  const [showImport, setShowImport] = useState(false);
  const [importPreview, setImportPreview] = useState<Partial<Usuario>[]>([]);
  const [importError, setImportError] = useState('');
  const [importando, setImportando] = useState(false);
  const [importResultado, setImportResultado] = useState<{ ok: number; error: number } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    nombre: '', email: '', contraseña: '', rol: 'teacher' as Usuario['rol'],
  });

  useEffect(() => { cargar(); }, []);

  const cargar = () => {
    setCargando(true);
    const us = lsCargar();
    const docs = lsDocentes();
    setUsuarios(us);
    setDocentes(docs);
    setCargando(false);
  };

  const mostrarMensaje = (tipo: 'ok' | 'err', msg: string) => {
    if (tipo === 'ok') { setSuccess(msg); setTimeout(() => setSuccess(''), 3500); }
    else { setError(msg); setTimeout(() => setError(''), 4000); }
  };

  // ── CRUD usuarios ─────────────────────────────────────────────────
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!formData.nombre.trim()) return mostrarMensaje('err', 'El nombre es requerido');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) return mostrarMensaje('err', 'Email inválido');
    if (!editando && formData.contraseña.length < 6) return mostrarMensaje('err', 'Contraseña mínimo 6 caracteres');

    setGuardando(true);
    const todos = lsCargar();
    try {
      if (editando) {
        const idx = todos.findIndex(u => u.id === editando.id);
        if (idx >= 0) {
          todos[idx] = {
            ...todos[idx],
            nombre: formData.nombre,
            email: formData.email,
            rol: formData.rol,
            ...(formData.contraseña ? { contraseña: formData.contraseña } : {}),
          };
        }
        mostrarMensaje('ok', 'Usuario actualizado');
      } else {
        if (todos.some(u => u.email === formData.email))
          return mostrarMensaje('err', 'Ese email ya existe');
        todos.push({
          id: 'usr-' + Date.now(),
          nombre: formData.nombre,
          email: formData.email,
          contraseña: formData.contraseña,
          rol: formData.rol,
          activo: true,
          creado: new Date().toISOString(),
        });
        mostrarMensaje('ok', 'Usuario creado');
      }
      lsGuardar(todos);
      setShowForm(false);
      setEditando(null);
      setFormData({ nombre: '', email: '', contraseña: '', rol: 'teacher' });
      cargar();
    } catch (err: any) {
      mostrarMensaje('err', err.message || 'Error al guardar');
    } finally {
      setGuardando(false);
    }
  };

  const handleEliminar = (id: string) => {
    if (!confirm('¿Eliminar este usuario?')) return;
    setEliminando(id);
    lsGuardar(lsCargar().filter(u => u.id !== id));
    mostrarMensaje('ok', 'Usuario eliminado');
    cargar();
    setEliminando(null);
  };

  const handleEditar = (u: Usuario) => {
    setEditando(u);
    setFormData({ nombre: u.nombre, email: u.email, contraseña: '', rol: u.rol });
    setShowForm(true);
    setError('');
  };

  const toggleActivo = (id: string) => {
    const todos = lsCargar();
    const idx = todos.findIndex(u => u.id === id);
    if (idx >= 0) {
      todos[idx].activo = !todos[idx].activo;
      lsGuardar(todos);
      cargar();
      mostrarMensaje('ok', todos[idx].activo ? 'Usuario activado' : 'Usuario suspendido');
    }
  };

  // ── Asignar usuario a docente ─────────────────────────────────────
  const abrirAsignar = (doc: any) => {
    setDocenteSelec(doc);
    // Pre-llenar email si ya tiene usuario
    const usExistente = lsCargar().find(u => u.docenteId === doc.id);
    setAsignarForm({
      email: usExistente?.email || doc.email || '',
      contraseña: '',
      confirmar: '',
    });
    setShowAsignar(true);
  };

  const handleGuardarAsignar = () => {
    if (!asignarForm.email) return mostrarMensaje('err', 'Ingresa el email');
    if (asignarForm.contraseña && asignarForm.contraseña !== asignarForm.confirmar)
      return mostrarMensaje('err', 'Las contraseñas no coinciden');
    if (asignarForm.contraseña && asignarForm.contraseña.length < 6)
      return mostrarMensaje('err', 'Contraseña mínimo 6 caracteres');

    const todos = lsCargar();
    const existente = todos.find(u => u.docenteId === docenteSelec.id);
    if (existente) {
      const idx = todos.findIndex(u => u.id === existente.id);
      todos[idx].email = asignarForm.email;
      if (asignarForm.contraseña) todos[idx].contraseña = asignarForm.contraseña;
      lsGuardar(todos);
      mostrarMensaje('ok', 'Credenciales actualizadas');
    } else {
      if (!asignarForm.contraseña) return mostrarMensaje('err', 'Contraseña requerida para nuevo usuario');
      if (todos.some(u => u.email === asignarForm.email))
        return mostrarMensaje('err', 'Ese email ya tiene cuenta');
      todos.push({
        id: 'usr-' + Date.now(),
        nombre: docenteSelec.nombre || docenteSelec.apellidos_nombres || '',
        email: asignarForm.email,
        contraseña: asignarForm.contraseña,
        rol: 'teacher',
        activo: true,
        creado: new Date().toISOString(),
        docenteId: docenteSelec.id,
      });
      lsGuardar(todos);
      mostrarMensaje('ok', 'Usuario docente creado');
    }
    setShowAsignar(false);
    setDocenteSelec(null);
    cargar();
  };

  // ── Importación ───────────────────────────────────────────────────
  const handleArchivo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportError('');
    setImportResultado(null);
    const isCSV = file.name.endsWith('.csv');
    const isXLSX = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');
    if (!isCSV && !isXLSX) { setImportError('Solo .csv, .xlsx o .xls'); return; }

    if (isCSV) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const rows = parseCSV(ev.target?.result as string);
        if (!rows.length) { setImportError('Sin datos válidos'); return; }
        setImportPreview(rows);
        setShowImport(true);
      };
      reader.readAsText(file);
    } else {
      const reader = new FileReader();
      reader.onload = async (ev) => {
        try {
          // @ts-ignore
          const XLSX = await import('https://cdn.sheetjs.com/xlsx-0.20.2/package/xlsx.mjs');
          const wb = XLSX.read(new Uint8Array(ev.target?.result as ArrayBuffer), { type: 'array' });
          const ws = wb.Sheets[wb.SheetNames[0]];
          const json: any[] = XLSX.utils.sheet_to_json(ws, { defval: '' });
          const rows: Partial<Usuario>[] = json.map((row: any) => {
            const k = (s: string) => Object.keys(row).find(k => k.toLowerCase().replace(/[_\s]/g,'') === s.toLowerCase().replace(/[_\s]/g,'')) || '';
            return {
              nombre: row[k('nombre')] || row[k('name')] || '',
              email: row[k('email')] || row[k('correo')] || '',
              contraseña: row[k('contraseña')] || row[k('contrasena')] || row[k('password')] || row[k('clave')] || '',
              rol: row[k('rol')] || row[k('role')] || 'teacher',
            };
          });
          if (!rows.length) { setImportError('Excel sin datos'); return; }
          setImportPreview(rows);
          setShowImport(true);
        } catch { setImportError('Error leyendo Excel. Usa CSV.'); }
      };
      reader.readAsArrayBuffer(file);
    }
    e.target.value = '';
  };

  const handleImportar = () => {
    setImportando(true);
    let ok = 0, errores = 0;
    const todos = lsCargar();
    const emailsExistentes = new Set(todos.map(u => u.email));
    for (const u of importPreview) {
      if (!u.nombre || !u.email || !u.contraseña) { errores++; continue; }
      if (emailsExistentes.has(u.email!)) { errores++; continue; }
      todos.push({
        id: 'usr-' + Date.now() + '-' + Math.random().toString(36).slice(2,6),
        nombre: u.nombre!, email: u.email!, contraseña: u.contraseña!,
        rol: (u.rol as any) || 'teacher', activo: true,
        creado: new Date().toISOString(),
      });
      emailsExistentes.add(u.email!);
      ok++;
    }
    lsGuardar(todos);
    setImportResultado({ ok, error: errores });
    setImportando(false);
    cargar();
  };

  const descargarPlantilla = () => {
    const csv = 'nombre,email,contraseña,rol\nJuan Pérez,juan@manuelfidencio.edu.pe,clave123,teacher\nMaría García,maria@manuelfidencio.edu.pe,clave123,student';
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'plantilla_usuarios.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  // Detectar si docente ya tiene usuario
  const usuariosMap = new Map(usuarios.map(u => [u.docenteId, u]));

  const usuariosFiltrados = usuarios.filter(u => {
    const matchB = u.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
                   u.email.toLowerCase().includes(busqueda.toLowerCase());
    const matchR = filtroRol === 'todos' || u.rol === filtroRol;
    return matchB && matchR;
  });

  const inputCls = "w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 text-sm";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">

      {/* Header */}
      <div className="sticky top-0 z-40 backdrop-blur-xl bg-slate-900/80 border-b border-purple-500/20">
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-3xl font-black text-white">👥 Gestión de Usuarios</h1>
            <p className="text-purple-400/70 text-sm mt-0.5">{usuarios.length} usuarios · {docentes.length} docentes</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button onClick={cargar} className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm">
              <RefreshCw size={14} /> Actualizar
            </button>
            <button onClick={descargarPlantilla} className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm">
              <Download size={14} /> Plantilla CSV
            </button>
            <label className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm cursor-pointer">
              <Upload size={14} /> Importar
              <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={handleArchivo} />
            </label>
            <button onClick={() => { setEditando(null); setFormData({ nombre:'', email:'', contraseña:'', rol:'teacher' }); setError(''); setShowForm(!showForm); }}
              className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-purple-500 to-pink-600 text-white font-bold rounded-lg text-sm hover:opacity-90">
              <Plus size={16} /> Nuevo Usuario
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">

        {/* Stats */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {Object.entries(ROL_CONFIG).map(([rol, cfg]) => (
            <button key={rol} onClick={() => setFiltroRol(filtroRol === rol ? 'todos' : rol)}
              className={`rounded-xl p-3 border transition-all text-left ${filtroRol === rol ? 'border-purple-400 bg-purple-500/20' : 'border-purple-500/20 bg-slate-800/60 hover:border-purple-500/40'}`}>
              <div className="text-xl mb-1">{cfg.label.split(' ')[0]}</div>
              <div className="text-2xl font-bold text-white">{usuarios.filter(u => u.rol === rol).length}</div>
              <div className="text-xs text-purple-400/60 truncate">{cfg.label.split(' ').slice(1).join(' ')}</div>
            </button>
          ))}
        </div>

        {/* Mensajes */}
        <AnimatePresence>
          {success && (
            <motion.div initial={{ opacity:0, y:-8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
              className="flex items-center gap-3 bg-green-500/20 border border-green-500/40 text-green-300 rounded-lg px-4 py-3 text-sm">
              <Check size={16} /> {success}
            </motion.div>
          )}
          {error && (
            <motion.div initial={{ opacity:0, y:-8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
              className="flex items-center gap-3 bg-red-500/20 border border-red-500/40 text-red-300 rounded-lg px-4 py-3 text-sm">
              <AlertCircle size={16} /> {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── SECCIÓN DOCENTES SIN USUARIO ── */}
        {docentes.filter(d => !usuariosMap.has(d.id)).length > 0 && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-5">
            <h2 className="text-amber-300 font-bold mb-3 flex items-center gap-2">
              <Key size={16} /> Docentes sin acceso al sistema ({docentes.filter(d => !usuariosMap.has(d.id)).length})
            </h2>
            <div className="space-y-2">
              {docentes.filter(d => !usuariosMap.has(d.id)).map(doc => (
                <div key={doc.id} className="flex items-center justify-between bg-slate-800/60 rounded-lg px-4 py-3">
                  <div>
                    <p className="text-white text-sm font-medium">{doc.nombre || doc.apellidos_nombres}</p>
                    <p className="text-slate-400 text-xs">{doc.especialidad || doc.area || 'Docente'} · {doc.email || 'Sin email'}</p>
                  </div>
                  <button onClick={() => abrirAsignar(doc)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-lg text-xs">
                    <Key size={12} /> Asignar acceso
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── SECCIÓN DOCENTES CON USUARIO ── */}
        {docentes.filter(d => usuariosMap.has(d.id)).length > 0 && (
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-5">
            <h2 className="text-blue-300 font-bold mb-3 flex items-center gap-2">
              <Check size={16} /> Docentes con acceso ({docentes.filter(d => usuariosMap.has(d.id)).length})
            </h2>
            <div className="space-y-2">
              {docentes.filter(d => usuariosMap.has(d.id)).map(doc => {
                const usr = usuariosMap.get(doc.id)!;
                return (
                  <div key={doc.id} className="flex items-center justify-between bg-slate-800/60 rounded-lg px-4 py-3">
                    <div>
                      <p className="text-white text-sm font-medium">{doc.nombre || doc.apellidos_nombres}</p>
                      <p className="text-slate-400 text-xs">{usr.email} · {usr.activo ? '🟢 Activo' : '🔴 Suspendido'}</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => abrirAsignar(doc)}
                        className="p-1.5 bg-blue-500/20 hover:bg-blue-500/40 rounded-lg text-blue-400 text-xs">
                        <Edit2 size={13} />
                      </button>
                      <button onClick={() => toggleActivo(usr.id)}
                        className={`p-1.5 rounded-lg text-xs ${usr.activo ? 'bg-red-500/20 hover:bg-red-500/40 text-red-400' : 'bg-green-500/20 hover:bg-green-500/40 text-green-400'}`}>
                        {usr.activo ? <UserX size={13} /> : <UserCheck size={13} />}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Modal asignar acceso a docente */}
        {showAsignar && docenteSelec && (
          <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
            <div className="bg-slate-800 border border-amber-500/30 rounded-2xl w-full max-w-md p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-white">🔑 Acceso para docente</h2>
                <button onClick={() => setShowAsignar(false)}><X size={18} className="text-slate-400" /></button>
              </div>
              <p className="text-slate-300 text-sm">{docenteSelec.nombre || docenteSelec.apellidos_nombres}</p>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Email de acceso *</label>
                  <input type="email" value={asignarForm.email}
                    onChange={e => setAsignarForm({...asignarForm, email: e.target.value})}
                    placeholder="docente@manuelfidencio.edu.pe" className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Contraseña {usuariosMap.has(docenteSelec.id) ? '(dejar vacío = no cambiar)' : '*'}</label>
                  <input type="password" value={asignarForm.contraseña}
                    onChange={e => setAsignarForm({...asignarForm, contraseña: e.target.value})}
                    placeholder="••••••••" className={inputCls} />
                </div>
                {asignarForm.contraseña && (
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Confirmar contraseña</label>
                    <input type="password" value={asignarForm.confirmar}
                      onChange={e => setAsignarForm({...asignarForm, confirmar: e.target.value})}
                      placeholder="••••••••" className={inputCls} />
                  </div>
                )}
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={handleGuardarAsignar}
                  className="flex-1 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-black font-bold rounded-lg text-sm">
                  Guardar acceso
                </button>
                <button onClick={() => setShowAsignar(false)}
                  className="px-5 py-2.5 bg-slate-700 text-white rounded-lg hover:bg-slate-600 text-sm">
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Importación */}
        <AnimatePresence>
          {showImport && (
            <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
              className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
              <div className="bg-slate-800 border border-purple-500/30 rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
                <div className="flex items-center justify-between p-6 border-b border-slate-700">
                  <h2 className="text-xl font-bold text-white">📥 Importar {importPreview.length} usuarios</h2>
                  <button onClick={() => { setShowImport(false); setImportPreview([]); setImportResultado(null); }}>
                    <X size={20} className="text-slate-400" />
                  </button>
                </div>
                {importResultado ? (
                  <div className="p-8 text-center space-y-4">
                    <div className="text-5xl">{importResultado.error === 0 ? '🎉' : '⚠️'}</div>
                    <p className="text-white text-xl font-bold">Importación completada</p>
                    <div className="flex justify-center gap-8">
                      <div><div className="text-3xl font-black text-green-400">{importResultado.ok}</div><div className="text-slate-400 text-sm">creados</div></div>
                      <div><div className="text-3xl font-black text-red-400">{importResultado.error}</div><div className="text-slate-400 text-sm">errores</div></div>
                    </div>
                    <button onClick={() => { setShowImport(false); setImportPreview([]); setImportResultado(null); }}
                      className="mt-2 px-6 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-bold">Cerrar</button>
                  </div>
                ) : (
                  <>
                    <div className="overflow-auto flex-1 p-4">
                      {importError && <p className="text-red-400 text-sm mb-3">{importError}</p>}
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="text-purple-400/70 border-b border-slate-700">
                            {['Nombre','Email','Contraseña','Rol','Estado'].map(h => (
                              <th key={h} className="text-left pb-2 pr-3 font-medium">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700/50">
                          {importPreview.map((u, i) => {
                            const valido = !!(u.nombre && u.email && u.contraseña);
                            return (
                              <tr key={i} className={valido ? '' : 'opacity-40'}>
                                <td className="py-1.5 pr-3 text-white">{u.nombre || '—'}</td>
                                <td className="py-1.5 pr-3 text-slate-300">{u.email || '—'}</td>
                                <td className="py-1.5 pr-3 text-slate-400">{'•'.repeat(Math.min((u.contraseña||'').length,8))}</td>
                                <td className="py-1.5 pr-3"><span className="px-2 py-0.5 bg-slate-700 rounded text-slate-300">{u.rol || 'teacher'}</span></td>
                                <td className="py-1.5">{valido ? <Check size={12} className="text-green-400" /> : <AlertCircle size={12} className="text-red-400" />}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                    <div className="p-4 border-t border-slate-700 flex gap-3">
                      <button onClick={handleImportar} disabled={importando}
                        className="flex-1 py-2.5 bg-gradient-to-r from-emerald-500 to-green-600 text-white font-bold rounded-lg disabled:opacity-60 flex items-center justify-center gap-2">
                        {importando ? <><RefreshCw size={14} className="animate-spin" />Importando...</> : `✓ Importar ${importPreview.filter(u=>u.nombre&&u.email&&u.contraseña).length} usuarios`}
                      </button>
                      <button onClick={() => { setShowImport(false); setImportPreview([]); }}
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
          <div className="bg-slate-800 border border-purple-500/30 rounded-xl p-6">
            <h2 className="text-xl font-bold text-white mb-5">{editando ? '✏️ Editar Usuario' : '➕ Nuevo Usuario'}</h2>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-purple-400/80 text-xs font-medium mb-1.5">Nombre completo *</label>
                <input type="text" value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})}
                  placeholder="Juan Pérez García" className={inputCls} />
              </div>
              <div>
                <label className="block text-purple-400/80 text-xs font-medium mb-1.5">Email *</label>
                <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})}
                  placeholder="juan@manuelfidencio.edu.pe" className={inputCls} />
              </div>
              <div>
                <label className="block text-purple-400/80 text-xs font-medium mb-1.5">
                  Contraseña {editando ? '(vacío = no cambiar)' : '*'}
                </label>
                <input type="password" value={formData.contraseña} onChange={e => setFormData({...formData, contraseña: e.target.value})}
                  placeholder="••••••••" className={inputCls} />
              </div>
              <div>
                <label className="block text-purple-400/80 text-xs font-medium mb-1.5">Rol *</label>
                <select value={formData.rol} onChange={e => setFormData({...formData, rol: e.target.value as any})} className={inputCls}>
                  {Object.entries(ROL_CONFIG).map(([rol, cfg]) => (
                    <option key={rol} value={rol}>{cfg.label}</option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2 flex gap-3 pt-2">
                <button type="submit" disabled={guardando}
                  className="flex-1 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold rounded-lg disabled:opacity-60 text-sm flex items-center justify-center gap-2">
                  {guardando ? <><RefreshCw size={14} className="animate-spin" />Guardando...</> : `✓ ${editando ? 'Actualizar' : 'Crear'} Usuario`}
                </button>
                <button type="button" onClick={() => { setShowForm(false); setEditando(null); setError(''); }}
                  className="px-6 py-2.5 bg-slate-700 text-white rounded-lg hover:bg-slate-600 text-sm">Cancelar</button>
              </div>
            </form>
          </div>
        )}

        {/* Búsqueda */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={17} />
          <input type="text" placeholder="Buscar por nombre o email..." value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 text-sm" />
        </div>

        {/* Lista usuarios */}
        {cargando ? (
          <div className="text-center py-16">
            <RefreshCw size={30} className="animate-spin text-purple-400 mx-auto mb-3" />
            <p className="text-slate-400">Cargando...</p>
          </div>
        ) : usuariosFiltrados.length === 0 ? (
          <div className="text-center py-12 text-slate-500">No se encontraron usuarios</div>
        ) : (
          <div className="space-y-2">
            {usuariosFiltrados.map((u, i) => (
              <motion.div key={u.id} initial={{ opacity:0, x:-12 }} animate={{ opacity:1, x:0 }} transition={{ delay: i*0.02 }}
                className={`bg-slate-800/70 border rounded-xl px-5 py-4 flex items-center gap-4 transition-all ${u.activo ? 'border-slate-700/60 hover:border-purple-500/30' : 'border-red-500/20 opacity-60'}`}>
                <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${ROL_CONFIG[u.rol]?.color || 'from-slate-500 to-slate-600'} flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}>
                  {u.nombre.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-white font-semibold truncate">{u.nombre}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold bg-gradient-to-r ${ROL_CONFIG[u.rol]?.color} text-white`}>
                      {ROL_CONFIG[u.rol]?.label || u.rol}
                    </span>
                    {!u.activo && <span className="px-2 py-0.5 bg-red-500/20 text-red-400 rounded-full text-xs font-bold">SUSPENDIDO</span>}
                  </div>
                  <div className="flex items-center gap-3 mt-0.5 text-xs text-slate-400 flex-wrap">
                    <span>{u.email}</span>
                    <span className="flex items-center gap-1">
                      {mostrarPassword === u.id ? u.contraseña : '••••••••'}
                      <button onClick={() => setMostrarPassword(mostrarPassword === u.id ? null : u.id)}
                        className="hover:text-purple-400 ml-0.5">
                        {mostrarPassword === u.id ? <EyeOff size={11} /> : <Eye size={11} />}
                      </button>
                    </span>
                  </div>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button onClick={() => toggleActivo(u.id)}
                    className={`p-2 rounded-lg transition-all ${u.activo ? 'bg-red-500/15 hover:bg-red-500/30 text-red-400' : 'bg-green-500/15 hover:bg-green-500/30 text-green-400'}`}
                    title={u.activo ? 'Suspender' : 'Activar'}>
                    {u.activo ? <UserX size={15} /> : <UserCheck size={15} />}
                  </button>
                  <button onClick={() => handleEditar(u)}
                    className="p-2 bg-blue-500/15 hover:bg-blue-500/30 rounded-lg text-blue-400">
                    <Edit2 size={15} />
                  </button>
                  <button onClick={() => handleEliminar(u.id)} disabled={eliminando === u.id}
                    className="p-2 bg-red-500/15 hover:bg-red-500/30 rounded-lg text-red-400 disabled:opacity-50">
                    {eliminando === u.id ? <RefreshCw size={15} className="animate-spin" /> : <Trash2 size={15} />}
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
