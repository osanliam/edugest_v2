import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Trash2, Edit2, Shield, Users, Search, Eye, EyeOff, CheckCircle, XCircle } from 'lucide-react';

interface Usuario {
  id: string;
  nombre: string;
  email: string;
  contraseña: string;
  rol: 'admin' | 'teacher' | 'parent' | 'student';
  activo: boolean;
  creado: string;
}

export default function AdminUsersScreen() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editando, setEditando] = useState<Usuario | null>(null);
  const [mostrarPassword, setMostrarPassword] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    contraseña: '',
    rol: 'teacher' as const,
  });

  useEffect(() => {
    cargarUsuarios();
  }, []);

  const cargarUsuarios = async () => {
    try {
      // Intentar traer del backend
      const token = localStorage.getItem('token');
      if (token) {
        const res = await fetch('http://localhost:3005/api/users', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          const usuariosFormato = data.map((u: any) => ({
            id: u.id,
            nombre: u.name,
            email: u.email,
            contraseña: u.password || 'hidden',
            rol: u.role,
            activo: true,
            creado: new Date().toISOString()
          }));
          setUsuarios(usuariosFormato);
          localStorage.setItem('sistema_usuarios', JSON.stringify(usuariosFormato));
          return;
        }
      }

      // Si falla, usar localStorage
      const stored = localStorage.getItem('sistema_usuarios');
      if (stored) {
        setUsuarios(JSON.parse(stored));
      }
    } catch (err) {
      // Fallback a localStorage
      const stored = localStorage.getItem('sistema_usuarios');
      if (stored) setUsuarios(JSON.parse(stored));
    }
  };

  const validarEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const emailYaExiste = (email: string, excluidoId?: string) => {
    return usuarios.some(u => u.email === email && u.id !== excluidoId);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.nombre.trim()) {
      setError('El nombre es requerido');
      return;
    }

    if (!validarEmail(formData.email)) {
      setError('Email inválido');
      return;
    }

    if (emailYaExiste(formData.email, editando?.id)) {
      setError('Este email ya está registrado');
      return;
    }

    if (formData.contraseña.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    let nuevosUsuarios;

    if (editando) {
      nuevosUsuarios = usuarios.map(u =>
        u.id === editando.id
          ? { ...u, ...formData, id: editando.id }
          : u
      );
      setSuccess('Usuario actualizado correctamente');
    } else {
      const nuevoUsuario: Usuario = {
        id: Date.now().toString(),
        ...formData,
        activo: true,
        creado: new Date().toISOString()
      };
      nuevosUsuarios = [...usuarios, nuevoUsuario];
      setSuccess('Usuario creado correctamente');
    }

    setUsuarios(nuevosUsuarios);
    localStorage.setItem('sistema_usuarios', JSON.stringify(nuevosUsuarios));

    setFormData({ nombre: '', email: '', contraseña: '', rol: 'teacher' });
    setEditando(null);
    setShowForm(false);

    setTimeout(() => setSuccess(''), 3000);
  };

  const handleEliminar = (id: string) => {
    if (confirm('¿Eliminar usuario?')) {
      const nuevosUsuarios = usuarios.filter(u => u.id !== id);
      setUsuarios(nuevosUsuarios);
      localStorage.setItem('sistema_usuarios', JSON.stringify(nuevosUsuarios));
      setSuccess('Usuario eliminado');
      setTimeout(() => setSuccess(''), 3000);
    }
  };

  const handleEditar = (usuario: Usuario) => {
    setEditando(usuario);
    setFormData({
      nombre: usuario.nombre,
      email: usuario.email,
      contraseña: usuario.contraseña,
      rol: usuario.rol
    });
    setShowForm(true);
  };

  const usuariosFiltrados = usuarios.filter(u =>
    u.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    u.email.toLowerCase().includes(busqueda.toLowerCase())
  );

  const rolesColores = {
    admin: { bg: 'from-purple-500 to-pink-600', label: '👑 Administrador' },
    teacher: { bg: 'from-blue-500 to-cyan-600', label: '👨‍🏫 Docente' },
    parent: { bg: 'from-green-500 to-emerald-600', label: '👨‍👩‍👧 Apoderado' },
    student: { bg: 'from-yellow-500 to-orange-600', label: '👨‍🎓 Estudiante' }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-40 backdrop-blur-xl bg-slate-900/80 border-b border-purple-500/20"
      >
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-black text-white mb-2">👥 Gestión de Usuarios</h1>
              <p className="text-purple-400/80">Administra docentes, padres y estudiantes</p>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                setEditando(null);
                setFormData({ nombre: '', email: '', contraseña: '', rol: 'teacher' });
                setShowForm(!showForm);
              }}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white font-bold rounded-lg hover:shadow-lg hover:shadow-purple-500/50"
            >
              <Plus size={20} /> Nuevo Usuario
            </motion.button>
          </div>
        </div>
      </motion.div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total', value: usuarios.length, icon: '👥' },
            { label: 'Docentes', value: usuarios.filter(u => u.rol === 'teacher').length, icon: '👨‍🏫' },
            { label: 'Estudiantes', value: usuarios.filter(u => u.rol === 'student').length, icon: '👨‍🎓' },
            { label: 'Apoderados', value: usuarios.filter(u => u.rol === 'parent').length, icon: '👨‍👩‍👧' }
          ].map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-gradient-to-br from-slate-800 to-slate-700 border border-purple-500/20 rounded-xl p-4 hover:border-purple-500/40"
            >
              <div className="text-2xl mb-2">{stat.icon}</div>
              <div className="text-purple-400/60 text-sm">{stat.label}</div>
              <div className="text-3xl font-bold text-white">{stat.value}</div>
            </motion.div>
          ))}
        </div>

        {/* Formulario */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-gradient-to-br from-slate-800 to-slate-700 border border-purple-500/30 rounded-xl p-8 mb-8"
            >
              <h2 className="text-2xl font-bold text-white mb-6">
                {editando ? '✏️ Editar Usuario' : '➕ Nuevo Usuario'}
              </h2>

              {error && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-red-500/20 border border-red-500/50 text-red-300 rounded-lg p-4 mb-6"
                >
                  {error}
                </motion.div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-purple-400/80 text-sm font-medium mb-2">Nombre Completo *</label>
                    <input
                      type="text"
                      value={formData.nombre}
                      onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                      placeholder="Juan Pérez García"
                      className="w-full bg-slate-700 border border-purple-500/20 rounded-lg px-4 py-2 text-white placeholder-purple-400/40 focus:outline-none focus:border-purple-500/50"
                    />
                  </div>

                  <div>
                    <label className="block text-purple-400/80 text-sm font-medium mb-2">Email *</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      placeholder="juan@sistemita.edu"
                      className="w-full bg-slate-700 border border-purple-500/20 rounded-lg px-4 py-2 text-white placeholder-purple-400/40 focus:outline-none focus:border-purple-500/50"
                    />
                  </div>

                  <div>
                    <label className="block text-purple-400/80 text-sm font-medium mb-2">Contraseña *</label>
                    <input
                      type="password"
                      value={formData.contraseña}
                      onChange={(e) => setFormData({...formData, contraseña: e.target.value})}
                      placeholder="••••••••"
                      className="w-full bg-slate-700 border border-purple-500/20 rounded-lg px-4 py-2 text-white placeholder-purple-400/40 focus:outline-none focus:border-purple-500/50"
                    />
                  </div>

                  <div>
                    <label className="block text-purple-400/80 text-sm font-medium mb-2">Rol *</label>
                    <select
                      value={formData.rol}
                      onChange={(e) => setFormData({...formData, rol: e.target.value as any})}
                      className="w-full bg-slate-700 border border-purple-500/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500/50"
                    >
                      <option value="teacher">👨‍🏫 Docente</option>
                      <option value="student">👨‍🎓 Estudiante</option>
                      <option value="parent">👨‍👩‍👧 Apoderado</option>
                      <option value="admin">👑 Administrador</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold py-3 rounded-lg hover:shadow-lg"
                  >
                    ✓ {editando ? 'Actualizar' : 'Crear'} Usuario
                  </motion.button>
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="flex-1 bg-slate-700 text-white font-bold py-3 rounded-lg hover:bg-slate-600"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mensajes de éxito */}
        <AnimatePresence>
          {success && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="bg-green-500/20 border border-green-500/50 text-green-300 rounded-lg p-4 mb-6"
            >
              ✓ {success}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Búsqueda */}
        <div className="relative mb-8">
          <Search className="absolute left-4 top-4 text-purple-400/50" size={20} />
          <input
            type="text"
            placeholder="Buscar por nombre o email..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-slate-800 border border-purple-500/20 rounded-lg text-white placeholder-purple-400/40 focus:outline-none focus:border-purple-500/50"
          />
        </div>

        {/* Lista de Usuarios */}
        <div className="space-y-3">
          {usuariosFiltrados.map((usuario, i) => (
            <motion.div
              key={usuario.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`bg-gradient-to-r ${rolesColores[usuario.rol].bg} bg-opacity-10 border border-purple-500/20 rounded-xl p-6 hover:border-purple-500/40 transition-all`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-bold text-white">{usuario.nombre}</h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r ${rolesColores[usuario.rol].bg} text-white`}>
                      {rolesColores[usuario.rol].label}
                    </span>
                  </div>
                  <p className="text-purple-400/60 text-sm mb-2">{usuario.email}</p>
                  <div className="flex items-center gap-4 text-xs text-purple-400/50">
                    <span>Contraseña: {mostrarPassword === usuario.id ? usuario.contraseña : '••••••••'}</span>
                    <button
                      onClick={() => setMostrarPassword(mostrarPassword === usuario.id ? null : usuario.id)}
                      className="hover:text-purple-400"
                    >
                      {mostrarPassword === usuario.id ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>

                <div className="flex gap-2">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleEditar(usuario)}
                    className="p-3 bg-blue-500/20 hover:bg-blue-500/40 rounded-lg text-blue-400 transition-all"
                  >
                    <Edit2 size={18} />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleEliminar(usuario.id)}
                    className="p-3 bg-red-500/20 hover:bg-red-500/40 rounded-lg text-red-400 transition-all"
                  >
                    <Trash2 size={18} />
                  </motion.button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {usuariosFiltrados.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <p className="text-purple-400/50 text-lg">No se encontraron usuarios</p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
