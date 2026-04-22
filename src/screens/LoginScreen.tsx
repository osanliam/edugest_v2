import { useState } from 'react';
import { motion } from "motion/react";
import { User, Lock, Eye, EyeOff } from "lucide-react";
import { User as UserType } from '../types';
import { mockLogin } from '../utils/mockAuth';

// En producción (Vercel) usa la API real; en local usa mock
async function loginRequest(email: string, password: string) {
  // Primero verificar en localStorage (usuarios registrados)
  try {
    const storedUsers = localStorage.getItem('sistema_usuarios');
    if (storedUsers) {
      const users = JSON.parse(storedUsers);
      const foundUser = users.find((u: any) => u.email === email && u.contraseña === password);
      if (foundUser) {
        return {
          token: 'local-token-' + foundUser.id,
          user: {
            id: foundUser.id,
            name: foundUser.nombre,
            email: foundUser.email,
            role: foundUser.rol,
            school_id: '1'
          }
        };
      }
    }
  } catch (e) {
    console.error('Error checking localStorage users:', e);
  }

  if (import.meta.env.PROD) {
    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Credenciales inválidas');
    }
    return res.json();
  }
  // Desarrollo local → mock
  return mockLogin(email, password);
}

// Cuentas de demo fijas (sin depender de localStorage ni API externa)
const DEMO_ACCOUNTS = [
  { id: 'user-admin', name: 'Administrador del Sistema', email: 'admin@manuelfidencio.edu.pe',       password: 'admin123',    role: '👑 ADMIN',          rol: 'admin' as const },
  { id: 'user-001',   name: 'Dr. Fernando López',        email: 'director@escuela.edu',    password: 'director123', role: '🏛️ Director',       rol: 'director' as const },
  { id: 'user-002',   name: 'Mg. María García',          email: 'subdirector@escuela.edu', password: 'sub123',      role: '📋 Subdirector',    rol: 'subdirector' as const },
  { id: 'user-003',   name: 'Lic. Juan Pérez',           email: 'profesor@escuela.edu',    password: 'prof123',     role: '👨‍🏫 Docente',      rol: 'teacher' as const },
  { id: 'user-004',   name: 'Carlos Mendez',             email: 'estudiante@escuela.edu',  password: 'est123',      role: '👨‍🎓 Estudiante',   rol: 'student' as const },
  { id: 'user-005',   name: 'Pedro Mendez',              email: 'apoderado@escuela.edu',   password: 'apod123',     role: '👨‍👩‍👧 Apoderado', rol: 'parent' as const },
];

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
      localStorage.setItem('auth_token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      const user: UserType = {
        id: data.user.id,
        name: data.user.name,
        email: data.user.email,
        role: data.user.role as any,
        schoolId: data.user.school_id,
      };
      onLogin(user);
    } catch (err) {
      setError('Usuario o contraseña incorrectos');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = async (account: typeof DEMO_ACCOUNTS[0]) => {
    setError('');
    setIsLoading(true);
    try {
      const user: UserType = {
        id: account.id,
        name: account.name,
        email: account.email,
        role: account.rol as any,
        schoolId: '1',
      };
      localStorage.setItem('user', JSON.stringify(user));
      onLogin(user);
    } catch (err) {
      setError('Error al iniciar sesión de demo');
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
          <div className="bg-gradient-to-r from-red-600 to-red-700 dark:from-red-700 dark:to-red-800 px-8 py-8 text-center">
            <h1 className="text-4xl font-bold text-white mb-2">🏫 EduGest</h1>
            <p className="text-red-100">IE Manuel Fidencio Hidalgo Flores</p>
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

            {/* Divider */}
            <div className="mt-6 relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-300 dark:border-slate-600"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                  Cuentas de Demo
                </span>
              </div>
            </div>

            {/* Demo Accounts */}
            <div className="mt-6 space-y-2">
              {DEMO_ACCOUNTS.map((account) => (
                <motion.button
                  key={account.email}
                  onClick={() => handleDemoLogin(account)}
                  whileHover={{ scale: 1.02 }}
                  className={`w-full text-left p-3 rounded-lg border transition-all ${
                    account.rol === 'admin'
                      ? 'border-red-600 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40'
                      : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-slate-900 dark:text-white">{account.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{account.email}</p>
                    </div>
                    <span className={`text-xs font-semibold px-2 py-1 rounded ${
                      account.rol === 'admin'
                        ? 'bg-red-600 text-white'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                    }`}>
                      {account.role}
                    </span>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center mt-6 text-sm text-slate-600 dark:text-slate-400">
          © 2024 EduGest - Sistema Integral de Educación
        </p>
      </motion.div>
    </div>
  );
}
