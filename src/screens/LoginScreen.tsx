import { useState } from 'react';
import { motion } from "motion/react";
import { User, Lock, Eye, EyeOff } from "lucide-react";
import { User as UserType } from '../types';
import { login as apiLogin, setToken, cargarTodo } from '../utils/apiClient';

// Siempre usa la API real — directo a Turso
async function loginRequest(email: string, password: string) {
  return apiLogin(email, password);
}

// Sin cuentas demo — todos usan sus credenciales reales registradas en el sistema

interface LoginScreenProps {
  onLogin: (user: UserType) => void;
}

export default function LoginScreen({ onLogin }: LoginScreenProps) {
  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const data = await loginRequest(usuario, password);
      // El token ya se guarda en sessionStorage dentro de apiClient.login()
      // Solo guardamos el user en sessionStorage para restaurar sesión al recargar
      sessionStorage.setItem('user', JSON.stringify(data.user));

      // Sincronización automática: descargar de Turso al login (por partes para evitar timeout)
      try {
        // Paso 1: lo esencial
        const todo = await cargarTodo('alumnos,asignaciones,docentes,columnas,unidades,normas');
        if (todo.asignaciones?.length) localStorage.setItem('cfg_asignaciones', JSON.stringify(todo.asignaciones));
        if (todo.alumnos?.length) localStorage.setItem('ie_alumnos', JSON.stringify(todo.alumnos));
        if (todo.docentes?.length) localStorage.setItem('ie_docentes', JSON.stringify(todo.docentes));
        if (todo.columnas?.length) localStorage.setItem('cal_columnas', JSON.stringify(todo.columnas));
        if (todo.unidades?.length) localStorage.setItem('cfg_unidades', JSON.stringify(todo.unidades));
        if (todo.normas?.length) localStorage.setItem('cfg_normas_convivencia', JSON.stringify(todo.normas));
        console.log('✅ Sync automático al login:', {
          alumnos: todo.alumnos?.length || 0,
          asignaciones: todo.asignaciones?.length || 0,
          docentes: todo.docentes?.length || 0,
        });
        // Paso 2: calificaciones y asistencia en segundo plano
        try {
          const resto = await cargarTodo('calificaciones,asistencia');
          if (resto.calificaciones?.length) localStorage.setItem('ie_calificativos_v2', JSON.stringify(resto.calificaciones));
          if (resto.asistencia?.length) localStorage.setItem('ie_asistencia', JSON.stringify(resto.asistencia));
        } catch { /* silencioso */ }
      } catch (syncErr: any) {
        console.warn('⚠️ Sync automático falló (seguimos con localStorage):', syncErr.message);
      }

      const user: UserType = {
        id: data.user.id,
        name: data.user.name,
        email: data.user.email,
        role: data.user.role as any,
        schoolId: data.user.school_id || '1',
        docenteId: data.user.docenteId,
      };
      onLogin(user);
    } catch (err: any) {
      setError(err.message || 'Usuario o contraseña incorrectos');
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950 flex items-center justify-center px-4">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-red-500/10 dark:bg-red-500/5 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/10 dark:bg-blue-500/5 rounded-full blur-3xl"></div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Login Card */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-red-600 to-red-700 dark:from-red-700 dark:to-red-800 px-8 py-8">
            <div className="flex items-center justify-center gap-4 mb-3">
              <img src="/logo.png" alt="Logo" className="h-16 w-auto" />
              <div>
                <h1 className="text-4xl font-bold text-white leading-tight">EduGest</h1>
              </div>
            </div>
            <p className="text-red-100 text-center">IE Manuel Fidencio Hidalgo Flores</p>
          </div>

          {/* Form */}
          <div className="p-8">
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mb-4 bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-700 text-red-800 dark:text-red-200 px-4 py-3 rounded-lg text-sm"
              >
                {error}
              </motion.div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Usuario
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-slate-500" />
                  <input
                    type="text"
                    value={usuario}
                    onChange={(e) => setUsuario(e.target.value)}
                    placeholder="admin.mfhf"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 dark:focus:ring-red-500 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Contraseña
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-slate-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 dark:focus:ring-red-500 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-400"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 disabled:from-slate-400 disabled:to-slate-500 text-white font-semibold py-2.5 rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Autenticando...
                  </>
                ) : (
                  'Iniciar Sesión'
                )}
              </button>
            </form>

            {/* Nota de acceso */}
            <div className="mt-6 p-3 rounded-lg bg-slate-50 dark:bg-slate-700/40 border border-slate-200 dark:border-slate-600 text-center">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Usa las credenciales asignadas por tu institución.<br />
                Contacta al administrador si no tienes acceso.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center mt-6 text-sm text-slate-600 dark:text-slate-400">
          © 2026 EduGest - Sistema Integral de Educación
        </p>
      </motion.div>
    </div>
  );
}
