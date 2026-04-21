import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Trash2, Edit2, Search, Eye, EyeOff, Upload, Download, X, Check, AlertCircle, RefreshCw } from 'lucide-react';

interface Usuario {
  id: string;
  nombre: string;
  email: string;
  contraseña: string;
  rol: 'admin' | 'director' | 'subdirector' | 'teacher' | 'parent' | 'student';
  activo: boolean;
  creado: string;
}

const ROL_CONFIG: Record<string, { label: string; color: string }> = {
  admin:       { label: '👑 Administrador', color: 'from-purple-500 to-pink-600' },
  director:    { label: '🏛️ Director',      color: 'from-red-500 to-rose-600' },
  subdirector: { label: '📋 Subdirector',   color: 'from-orange-500 to-amber-600' },
  teacher:     { label: '👨‍🏫 Docente',     color: 'from-blue-500 to-cyan-600' },
  parent:      { label: '👨‍👩‍👧 Apoderado', color: 'from-green-500 to-emerald-600' },
  student:     { label: '👨‍🎓 Estudiante',  color: 'from-yellow-500 to-orange-600' },
};

const TOKEN_KEY = 'auth_token';

function getToken() {
  return localStorage.getItem(TOKEN_KEY) || '';
}

async function apiGet(path: string) {
  const res = await fetch(path, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

async function apiPost(path: string, body: object) {
  const res = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error((await res.json()).error || 'Error');
  return res.json();
}

async function apiPut(path: string, body: object) {
  const res = await fetch(path, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error((await res.json()).error || 'Error');
  return res.json();
}

async function apiDelete(path: string) {
  const res = await fetch(path, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  if (!res.ok) throw new Error((await res.json()).error || 'Error');
  return res.json();
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
      nombre: obj.nombre || obj.name || obj.names || '',
      email: obj.email || obj.correo || '',
      contraseña: obj.contraseña || obj.contrasena || obj.password || obj.clave || '',
      rol: obj.rol || obj.role || obj.tipo || 'student',
    };
  });
}

export default function AdminUsersScreen() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
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

  // Importación masiva
  const [showImport, setShowImport] = useState(false);
  const [importPreview, setImportPreview] = useState<Partial<Usuario>[]>([]);
  const [importError, setImportError] = useState('');
  const [importando, setImportando] = useState(false);
  const [importResultado, setImportResultado] = useState<{ ok: number; error: number } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    nombre: '', email: '', contraseña: '', rol: 'teacher' as Usuario['rol'],
  });

  useEffect(() => { cargarUsuarios(); }, []);

  const cargarUsuarios = async () => {
    setCargando(true);
    try {
      const data = await apiGet('/api/users');
      const lista: Usuario[] = (data || []).map((u: any) => ({
        id: u.id,
        nombre: u.nombre || u.name || '',
        email: u.email,
        contraseña: u.contraseña || u.password || '••••••',
        rol: u.rol || u.role || 'student',
        activo: u.activo !== undefined ? Boolean(u.activo) : true,
        creado: u.creado || u.created_at || new Date().toISOString(),
      }));
      setUsuarios(lista);
    } catch {
      setError('No se pudo cargar usuarios desde el servidor');
    } finally {
      setCargando(false);
    }
  };

  const mostrarMensaje = (tipo: 'ok' | 'err', msg: string) => {
    if (tipo === 'ok') { setSuccess(msg); setTimeout(() => setSuccess(''), 3500); }
    else { setError(msg); setTimeout(() => setError(''), 4000); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!formData.nombre.trim()) return mostrarMensaje('err', 'El nombre es requerido');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) return mostrarMensaje('err', 'Email inválido');
    if (!editando && formData.contraseña.length < 6) return mostrarMensaje('err', 'Contraseña mínimo 6 caracteres');

    setGuardando(true);
    try {
      if (editando) {
        await apiPut(`/api/users?id=${editando.id}`, formData);
        mostrarMensaje('ok', 'Usuario actualizado');
      } else {
        await apiPost('/api/users', formData);
        mostrarMensaje('ok', 'Usuario creado');
      }
      setShowForm(false);
      setEditando(null);
      setFormData({ nombre: '', email: '', contraseña: '', rol: 'teacher' });
      await cargarUsuarios();
    } catch (err: any) {
      mostrarMensaje('err', err.message || 'Error al guardar');
    } finally {
      setGuardando(false);
    }
  };

  const handleEliminar = async (id: string) => {
    if (!confirm('¿Eliminar este usuario?')) return;
    setEliminando(id);
    try {
      await apiDelete(`/api/users?id=${id}`);
      mostrarMensaje('ok', 'Usuario eliminado');
      await cargarUsuarios();
    } catch (err: any) {
      mostrarMensaje('err', err.message || 'Error al eliminar');
    } finally {
      setEliminando(null);
    }
  };

  const handleEditar = (u: Usuario) => {
    setEditando(u);
    setFormData({ nombre: u.nombre, email: u.email, contraseña: '', rol: u.rol });
    setShowForm(true);
    setError('');
  };

  // ── Importación Excel/CSV ──────────────────────────────────────────
  const handleArchivo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportError('');
    setImportResultado(null);

    const isCSV = file.name.endsWith('.csv');
    const isXLSX = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');

    if (!isCSV && !isXLSX) {
      setImportError('Solo se aceptan archivos .csv, .xlsx o .xls');
      return;
    }

    if (isCSV) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const text = ev.target?.result as string;
        const rows = parseCSV(text);
        if (rows.length === 0) {
          setImportError('El archivo no tiene datos válidos');
          return;
        }
        setImportPreview(rows);
        setShowImport(true);
      };
      reader.readAsText(file);
    }

    if (isXLSX) {
      const reader = new FileReader();
      reader.onload = async (ev) => {
        try {
          // Usar SheetJS que ya está disponible vía CDN en el proyecto
          // @ts-ignore
          const XLSX = await import('https://cdn.sheetjs.com/xlsx-0.20.2/package/xlsx.mjs');
          const data = new Uint8Array(ev.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheet = workbook.Sheets[workbook.SheetNames[0]];
          const json: any[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });
          const rows: Partial<Usuario>[] = json.map((row: any) => {
            const k = (s: string) => Object.keys(row).find(k => k.toLowerCase().replace(/[_\s]/g,'') === s.toLowerCase().replace(/[_\s]/g,'')) || '';
            return {
              nombre:    row[k('nombre')] || row[k('name')] || '',
              email:     row[k('email')] || row[k('correo')] || '',
              contraseña: row[k('contraseña')] || row[k('contrasena')] || row[k('password')] || row[k('clave')] || '',
              rol:       row[k('rol')] || row[k('role')] || row[k('tipo')] || 'student',
            };
          });
          if (rows.length === 0) { setImportError('El archivo Excel no tiene datos'); return; }
          setImportPreview(rows);
          setShowImport(true);
        } catch {
          setImportError('Error leyendo el archivo Excel. Prueba con CSV.');
        }
      };
      reader.readAsArrayBuffer(file);
    }

    // Limpiar input para permitir re-subir el mismo archivo
    e.target.value = '';
  };

  const handleImportar = async () => {
    setImportando(true);
    let ok = 0; let errores = 0;
    for (const u of importPreview) {
      if (!u.nombre || !u.email || !u.contraseña) { errores++; continue; }
      try {
        await apiPost('/api/users', {
          nombre: u.nombre,
          email: u.email,
          contraseña: u.contraseña,
          rol: u.rol || 'student',
        });
        ok++;
      } catch { errores++; }
    }
    setImportResultado({ ok, error: errores });
    setImportando(false);
    await cargarUsuarios();
  };

  const descargarPlantilla = () => {
    const csv = 'nombre,email,contraseña,rol\nJuan Pérez,juan@manuelfidencio.edu.pe,clave123,teacher\nMaría García,maria@manuelfidencio.edu.pe,clave123,student\nPedro López,pedro@manuelfidencio.edu.pe,clave123,parent';
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'plantilla_usuarios.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const usuariosFiltrados = usuarios.filter(u => {
    const matchBusqueda = u.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
                          u.email.toLowerCase().includes(busqueda.toLowerCase());
    const matchRol = filtroRol === 'todos' || u.rol === filtroRol;
    return matchBusqueda && matchRol;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">

      {/* Header */}
      <div className="sticky top-0 z-40 backdrop-blur-xl bg-slate-900/80 border-b border-purple-500/20">
        <div className="max-w-7xl mx-auto px-6 py-5">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h1 className="text-3xl font-black text-white">👥 Gestión de Usuarios</h1>
              <p className="text-purple-400/70 text-sm mt-0.5">Turso · {usuarios.length} usuarios registrados</p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <button onClick={cargarUsuarios}
                className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm transition-all">
                <RefreshCw size={15} /> Actualizar
              </button>
              <button onClick={descargarPlantilla}
                className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm transition-all">
                <Download size={15} /> Plantilla CSV
              </button>
              <label className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm cursor-pointer transition-all">
                <Upload size={15} /> Importar Excel/CSV
                <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={handleArchivo} />
              </label>
              <button onClick={() => { setEditando(null); setFormData({ nombre:'', email:'', contraseña:'', rol:'teacher' }); setError(''); setShowForm(!showForm); }}
                className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-purple-500 to-pink-600 text-white font-bold rounded-lg text-sm transition-all hover:opacity-90">
                <Plus size={16} /> Nuevo Usuario
              </button>
            </div>
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
              className="flex items-center gap-3 bg-green-500/20 border border-green-500/40 text-green-300 rounded-lg px-4 py-3">
              <Check size={18} /> {success}
            </motion.div>
          )}
          {error && (
            <motion.div initial={{ opacity:0, y:-8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
              className="flex items-center gap-3 bg-red-500/20 border border-red-500/40 text-red-300 rounded-lg px-4 py-3">
              <AlertCircle size={18} /> {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Modal Importación */}
        <AnimatePresence>
          {showImport && (
            <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
              className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
              <motion.div initial={{ scale:0.95 }} animate={{ scale:1 }} exit={{ scale:0.95 }}
                className="bg-slate-800 border border-purple-500/30 rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
                <div className="flex items-center justify-between p-6 border-b border-slate-700">
                  <h2 className="text-xl font-bold text-white">📥 Importar {importPreview.length} usuarios</h2>
                  <button onClick={() => { setShowImport(false); setImportPreview([]); setImportResultado(null); }}
                    className="text-slate-400 hover:text-white"><X size={20} /></button>
                </div>

                {importResultado ? (
                  <div className="p-8 text-center space-y-4">
                    <div className="text-5xl">{importResultado.error === 0 ? '🎉' : '⚠️'}</div>
                    <p className="text-white text-xl font-bold">Importación completada</p>
                    <div className="flex justify-center gap-6">
                      <div className="text-center">
                        <div className="text-3xl font-black text-green-400">{importResultado.ok}</div>
                        <div className="text-slate-400 text-sm">creados</div>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-black text-red-400">{importResultado.error}</div>
                        <div className="text-slate-400 text-sm">errores</div>
                      </div>
                    </div>
                    <button onClick={() => { setShowImport(false); setImportPreview([]); setImportResultado(null); }}
                      className="mt-4 px-6 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-bold">
                      Cerrar
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="overflow-auto flex-1 p-4">
                      {importError && (
                        <div className="text-red-400 text-sm mb-3 flex items-center gap-2">
                          <AlertCircle size={14} /> {importError}
                        </div>
                      )}
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-purple-400/70 border-b border-slate-700">
                            <th className="text-left pb-2 font-medium">Nombre</th>
                            <th className="text-left pb-2 font-medium">Email</th>
                            <th className="text-left pb-2 font-medium">Contraseña</th>
                            <th className="text-left pb-2 font-medium">Rol</th>
                            <th className="text-left pb-2 font-medium">Estado</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700/50">
                          {importPreview.map((u, i) => {
                            const valido = !!(u.nombre && u.email && u.contraseña);
                            return (
                              <tr key={i} className={`${valido ? '' : 'opacity-50'}`}>
                                <td className="py-2 text-white">{u.nombre || '—'}</td>
                                <td className="py-2 text-slate-300">{u.email || '—'}</td>
                                <td className="py-2 text-slate-400">{'•'.repeat(Math.min((u.contraseña||'').length, 8))}</td>
                                <td className="py-2">
                                  <span className="px-2 py-0.5 bg-slate-700 rounded text-slate-300 text-xs">{u.rol || 'student'}</span>
                                </td>
                                <td className="py-2">
                                  {valido
                                    ? <Check size={14} className="text-green-400" />
                                    : <AlertCircle size={14} className="text-red-400" title="Faltan datos" />}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                    <div className="p-4 border-t border-slate-700 flex gap-3">
                      <button onClick={handleImportar} disabled={importando}
                        className="flex-1 py-2.5 bg-gradient-to-r from-emerald-500 to-green-600 text-white font-bold rounded-lg disabled:opacity-60 flex items-center justify-center gap-2">
                        {importando ? <><RefreshCw size={16} className="animate-spin" /> Importando...</> : `✓ Importar ${importPreview.filter(u => u.nombre && u.email && u.contraseña).length} usuarios`}
                      </button>
                      <button onClick={() => { setShowImport(false); setImportPreview([]); }}
                        className="px-5 py-2.5 bg-slate-700 text-white rounded-lg hover:bg-slate-600">
                        Cancelar
                      </button>
                    </div>
                  </>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Formulario crear/editar */}
        <AnimatePresence>
          {showForm && (
            <motion.div initial={{ opacity:0, y:-16 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-16 }}
              className="bg-slate-800 border border-purple-500/30 rounded-xl p-6">
              <h2 className="text-xl font-bold text-white mb-5">
                {editando ? '✏️ Editar Usuario' : '➕ Nuevo Usuario'}
              </h2>
              <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-purple-400/80 text-xs font-medium mb-1.5">Nombre completo *</label>
                  <input type="text" value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})}
                    placeholder="Juan Pérez García"
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 text-sm" />
                </div>
                <div>
                  <label className="block text-purple-400/80 text-xs font-medium mb-1.5">Email *</label>
                  <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})}
                    placeholder="juan@manuelfidencio.edu.pe"
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 text-sm" />
                </div>
                <div>
                  <label className="block text-purple-400/80 text-xs font-medium mb-1.5">
                    Contraseña {editando ? '(dejar vacío = no cambiar)' : '*'}
                  </label>
                  <input type="password" value={formData.contraseña} onChange={e => setFormData({...formData, contraseña: e.target.value})}
                    placeholder="••••••••"
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 text-sm" />
                </div>
                <div>
                  <label className="block text-purple-400/80 text-xs font-medium mb-1.5">Rol *</label>
                  <select value={formData.rol} onChange={e => setFormData({...formData, rol: e.target.value as any})}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500 text-sm">
                    {Object.entries(ROL_CONFIG).map(([rol, cfg]) => (
                      <option key={rol} value={rol}>{cfg.label}</option>
                    ))}
                  </select>
                </div>
                <div className="sm:col-span-2 flex gap-3 pt-2">
                  <button type="submit" disabled={guardando}
                    className="flex-1 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold rounded-lg disabled:opacity-60 text-sm flex items-center justify-center gap-2">
                    {guardando ? <><RefreshCw size={14} className="animate-spin" /> Guardando...</> : `✓ ${editando ? 'Actualizar' : 'Crear'} Usuario`}
                  </button>
                  <button type="button" onClick={() => { setShowForm(false); setEditando(null); setError(''); }}
                    className="px-6 py-2.5 bg-slate-700 text-white rounded-lg hover:bg-slate-600 text-sm">
                    Cancelar
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Búsqueda */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
          <input type="text" placeholder="Buscar por nombre o email..." value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 text-sm" />
        </div>

        {/* Lista */}
        {cargando ? (
          <div className="text-center py-16">
            <RefreshCw size={32} className="animate-spin text-purple-400 mx-auto mb-3" />
            <p className="text-slate-400">Cargando usuarios desde Turso...</p>
          </div>
        ) : usuariosFiltrados.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-slate-500 text-lg">No se encontraron usuarios</p>
          </div>
        ) : (
          <div className="space-y-2">
            {usuariosFiltrados.map((u, i) => (
              <motion.div key={u.id}
                initial={{ opacity:0, x:-16 }} animate={{ opacity:1, x:0 }} transition={{ delay: i * 0.03 }}
                className="bg-slate-800/70 border border-slate-700/60 hover:border-purple-500/30 rounded-xl px-5 py-4 flex items-center gap-4 transition-all">
                {/* Avatar */}
                <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${ROL_CONFIG[u.rol]?.color || 'from-slate-500 to-slate-600'} flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}>
                  {u.nombre.charAt(0).toUpperCase()}
                </div>
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-white font-semibold truncate">{u.nombre}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold bg-gradient-to-r ${ROL_CONFIG[u.rol]?.color || 'from-slate-500 to-slate-600'} text-white`}>
                      {ROL_CONFIG[u.rol]?.label || u.rol}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-0.5 text-xs text-slate-400 flex-wrap">
                    <span>{u.email}</span>
                    <span className="flex items-center gap-1">
                      {mostrarPassword === u.id ? u.contraseña : '••••••••'}
                      <button onClick={() => setMostrarPassword(mostrarPassword === u.id ? null : u.id)}
                        className="hover:text-purple-400 transition-colors ml-0.5">
                        {mostrarPassword === u.id ? <EyeOff size={11} /> : <Eye size={11} />}
                      </button>
                    </span>
                  </div>
                </div>
                {/* Acciones */}
                <div className="flex gap-2 flex-shrink-0">
                  <button onClick={() => handleEditar(u)}
                    className="p-2 bg-blue-500/15 hover:bg-blue-500/30 rounded-lg text-blue-400 transition-all">
                    <Edit2 size={16} />
                  </button>
                  <button onClick={() => handleEliminar(u.id)} disabled={eliminando === u.id}
                    className="p-2 bg-red-500/15 hover:bg-red-500/30 rounded-lg text-red-400 transition-all disabled:opacity-50">
                    {eliminando === u.id ? <RefreshCw size={16} className="animate-spin" /> : <Trash2 size={16} />}
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
