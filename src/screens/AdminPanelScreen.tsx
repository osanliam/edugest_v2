import { motion } from 'motion/react';
import { useState, useEffect } from 'react';
import { Users, Plus, Edit2, Trash2, Shield, Activity, BarChart3, Zap } from 'lucide-react';
import { User } from '../types';
import api from '../utils/api';

interface AdminPanelScreenProps {
  user: User;
}

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  created_at: string;
  school_name: string;
}

interface AdminStats {
  users: {
    total_users: number;
    admins: number;
    directors: number;
    subdirectors: number;
    teachers: number;
    students: number;
    parents: number;
    active_users: number;
  };
  schools: {
    total_schools: number;
    total_students: number;
    total_teachers: number;
    total_courses: number;
    total_grades: number;
  };
}

export default function AdminPanelScreen({ user }: AdminPanelScreenProps) {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showNewUserForm, setShowNewUserForm] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'teacher',
    password: '',
    phone: '',
    address: '',
  });

  // Cargar datos
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [usersRes, statsRes] = await Promise.all([
        api.getAdminUsers(),
        api.getAdminStats(),
      ]);

      if (usersRes.data) setUsers(usersRes.data);
      if (statsRes.data) setStats(statsRes.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error cargando datos');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createAdminUser({
        ...formData,
        password: formData.password || 'temporal123',
      });
      alert('✅ Usuario creado exitosamente');
      setFormData({ name: '', email: '', role: 'teacher', password: '', phone: '', address: '' });
      setShowNewUserForm(false);
      fetchData();
    } catch (err) {
      alert('❌ ' + (err instanceof Error ? err.message : 'Error creando usuario'));
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    try {
      await api.updateAdminUser(editingUser.id, {
        name: formData.name || editingUser.name,
        role: formData.role,
      });
      alert('✅ Usuario actualizado exitosamente');
      setEditingUser(null);
      setFormData({ name: '', email: '', role: 'teacher', password: '', phone: '', address: '' });
      fetchData();
    } catch (err) {
      alert('❌ ' + (err instanceof Error ? err.message : 'Error actualizando usuario'));
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!confirm(`¿Desactivar usuario ${userName}?`)) return;

    try {
      await api.deleteAdminUser(userId);
      alert('✅ Usuario desactivado');
      fetchData();
    } catch (err) {
      alert('❌ ' + (err instanceof Error ? err.message : 'Error desactivando usuario'));
    }
  };

  const getRoleColor = (role: string) => {
    const colors: Record<string, string> = {
      admin: 'bg-red-500/20 text-red-200 border-red-500/50',
      director: 'bg-blue-500/20 text-blue-200 border-blue-500/50',
      subdirector: 'bg-purple-500/20 text-purple-200 border-purple-500/50',
      teacher: 'bg-green-500/20 text-green-200 border-green-500/50',
      student: 'bg-yellow-500/20 text-yellow-200 border-yellow-500/50',
      parent: 'bg-indigo-500/20 text-indigo-200 border-indigo-500/50',
    };
    return colors[role] || 'bg-gray-500/20 text-gray-200';
  };

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen p-6 flex items-center justify-center">
        <div className="glass-card p-8 neon-border-magenta text-center max-w-md">
          <Shield className="w-16 h-16 text-neon-magenta mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Acceso Denegado</h2>
          <p className="text-white/85">Solo administradores pueden acceder a esta sección.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 space-y-8 pb-24">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-neon-cyan/20 rounded-lg neon-border-cyan">
            <BarChart3 className="w-8 h-8 text-neon-cyan" />
          </div>
          <div>
            <h1 className="text-4xl font-bold tracking-tighter uppercase">
              Panel <span className="text-neon-magenta neon-text-magenta">Admin</span>
            </h1>
            <p className="text-xs text-white/75 font-mono tracking-widest">GESTIÓN DEL SISTEMA</p>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {[
            { label: 'Usuarios Totales', value: stats.users.total_users, icon: Users, color: 'neon-cyan' },
            { label: 'Administradores', value: stats.users.admins, icon: Shield, color: 'neon-magenta' },
            { label: 'Estudiantes', value: stats.schools.total_students, icon: Activity, color: 'neon-lime' },
            { label: 'Docentes', value: stats.users.teachers, icon: Zap, color: 'neon-blue' },
            { label: 'Cursos', value: stats.schools.total_courses, icon: BarChart3, color: 'neon-cyan' },
          ].map((kpi, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="glass-card p-4 neon-border-cyan hover:neon-border-magenta transition-all"
            >
              <div className="flex items-center justify-between mb-2">
                <p className="text-white/85 text-xs uppercase">{kpi.label}</p>
                <kpi.icon className={`w-5 h-5 text-${kpi.color}`} />
              </div>
              <p className="text-2xl font-bold text-white">{kpi.value}</p>
            </motion.div>
          ))}
        </div>
      )}

      {/* Usuarios Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-6 neon-border-cyan"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-white font-bold uppercase tracking-wider flex items-center gap-2">
            <Users className="w-5 h-5 text-neon-cyan" />
            Gestión de Usuarios
          </h2>
          <button
            onClick={() => setShowNewUserForm(!showNewUserForm)}
            className="bg-neon-cyan/20 border border-neon-cyan text-neon-cyan hover:bg-neon-cyan/30 px-4 py-2 rounded-lg flex items-center gap-2 transition-all"
          >
            <Plus className="w-4 h-4" />
            Nuevo Usuario
          </button>
        </div>

        {/* Nueva forma de usuario */}
        {showNewUserForm && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            onSubmit={handleCreateUser}
            className="mb-6 p-4 bg-white/5 border border-white/10 rounded-lg space-y-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Nombre"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder:text-white/75"
                required
              />
              <input
                type="email"
                placeholder="Email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder:text-white/75"
                required
              />
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
              >
                <option value="admin">Administrador</option>
                <option value="director">Director</option>
                <option value="subdirector">Subdirector</option>
                <option value="teacher">Docente</option>
                <option value="student">Estudiante</option>
                <option value="parent">Apoderado</option>
              </select>
              <input
                type="password"
                placeholder="Contraseña (opcional)"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder:text-white/75"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="bg-neon-cyan/20 border border-neon-cyan text-neon-cyan hover:bg-neon-cyan/30 px-4 py-2 rounded-lg transition-all"
              >
                Crear Usuario
              </button>
              <button
                type="button"
                onClick={() => setShowNewUserForm(false)}
                className="bg-white/10 border border-white/20 text-white hover:bg-white/20 px-4 py-2 rounded-lg transition-all"
              >
                Cancelar
              </button>
            </div>
          </motion.form>
        )}

        {/* Tabla de usuarios */}
        {loading ? (
          <div className="text-center py-8 text-white/75">Cargando usuarios...</div>
        ) : error ? (
          <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 text-red-200">
            ⚠️ {error}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-white/10">
                <tr className="text-white/85 text-xs uppercase">
                  <th className="text-left py-3 px-4">Nombre</th>
                  <th className="text-left py-3 px-4">Email</th>
                  <th className="text-left py-3 px-4">Rol</th>
                  <th className="text-left py-3 px-4">Estado</th>
                  <th className="text-left py-3 px-4">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <motion.tr
                    key={u.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="border-b border-white/5 hover:bg-white/5 transition-colors"
                  >
                    <td className="py-3 px-4 text-white font-medium">{u.name}</td>
                    <td className="py-3 px-4 text-white/90">{u.email}</td>
                    <td className="py-3 px-4">
                      <span className={`px-3 py-1 rounded-full border text-xs font-medium ${getRoleColor(u.role)}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        u.status === 'active'
                          ? 'bg-green-500/20 text-green-200'
                          : 'bg-red-500/20 text-red-200'
                      }`}>
                        {u.status === 'active' ? '✓ Activo' : '✗ Inactivo'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setEditingUser(u);
                            setFormData({ ...formData, name: u.name, role: u.role });
                          }}
                          className="p-1 hover:bg-blue-500/20 rounded transition-all"
                          title="Editar"
                        >
                          <Edit2 className="w-4 h-4 text-blue-400" />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(u.id, u.name)}
                          className="p-1 hover:bg-red-500/20 rounded transition-all"
                          title="Desactivar"
                        >
                          <Trash2 className="w-4 h-4 text-red-400" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {/* Editar Usuario Modal */}
      {editingUser && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        >
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className="glass-card p-6 neon-border-magenta max-w-md w-full"
          >
            <h3 className="text-xl font-bold text-white mb-4">Editar Usuario: {editingUser.name}</h3>
            <form onSubmit={handleUpdateUser} className="space-y-4">
              <input
                type="text"
                placeholder="Nombre"
                value={formData.name || editingUser.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder:text-white/75"
              />
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
              >
                <option value="admin">Administrador</option>
                <option value="director">Director</option>
                <option value="subdirector">Subdirector</option>
                <option value="teacher">Docente</option>
                <option value="student">Estudiante</option>
                <option value="parent">Apoderado</option>
              </select>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 bg-neon-cyan/20 border border-neon-cyan text-neon-cyan hover:bg-neon-cyan/30 px-4 py-2 rounded-lg transition-all"
                >
                  Guardar
                </button>
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="flex-1 bg-white/10 border border-white/20 text-white hover:bg-white/20 px-4 py-2 rounded-lg transition-all"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
