import { useState } from 'react';
import {
  Menu, X, LogOut, Moon, Sun, Bell, User, BarChart3, Users,
  BookOpen, MessageSquare, Home, Settings, Building2, Users2,
  Flame, Clock, CheckSquare, BookMarked, Shield, ChevronDown, GraduationCap, Cog
} from 'lucide-react';
import { User as UserType } from '../types';

interface MainLayoutModernProps {
  user: UserType;
  onLogout: () => void;
  darkMode: boolean;
  setDarkMode: (dark: boolean) => void;
  onNavigate: (screen: string) => void;
  children: React.ReactNode;
}

const allNavigationItems = [
  // SISTEMA
  { id: 'panel-admin',        label: 'Panel Admin',        icon: <Shield className="w-5 h-5" />,       roles: ['admin'],                                    category: 'Sistema' },
  { id: 'gestionar-usuarios', label: 'Gestionar Usuarios', icon: <Users className="w-5 h-5" />,        roles: ['admin'],                                    category: 'Sistema' },
  { id: 'configuracion',      label: 'Configuración',      icon: <Cog className="w-5 h-5" />,          roles: ['admin', 'director', 'subdirector'],          category: 'Sistema' },

  // PRINCIPAL
  { id: 'inicio',       label: 'Inicio',       icon: <Home className="w-5 h-5" />,        roles: ['admin', 'director', 'subdirector', 'teacher', 'student', 'parent'], category: 'Principal' },
  { id: 'aula-virtual', label: 'Aula Virtual', icon: <BookOpen className="w-5 h-5" />,    roles: ['admin', 'director', 'subdirector', 'teacher', 'student'],           category: 'Principal' },
  { id: 'mensajes',     label: 'Mensajes',     icon: <MessageSquare className="w-5 h-5" />,roles: ['admin', 'director', 'subdirector', 'teacher', 'student', 'parent'],category: 'Principal' },
  { id: 'informes',     label: 'Informes',     icon: <BarChart3 className="w-5 h-5" />,   roles: ['admin', 'director', 'subdirector', 'teacher', 'student', 'parent'], category: 'Principal' },
  { id: 'comunidad',    label: 'Comunidad',    icon: <Users2 className="w-5 h-5" />,      roles: ['admin', 'director', 'subdirector', 'teacher', 'student', 'parent'], category: 'Principal' },

  // ADMINISTRACIÓN
  { id: 'panel-director',    label: 'Panel Director',    icon: <Building2 className="w-5 h-5" />, roles: ['admin', 'director', 'subdirector'], category: 'Administración' },
  { id: 'panel-subdirector', label: 'Panel Subdirector', icon: <Users className="w-5 h-5" />,    roles: ['admin', 'subdirector'],             category: 'Administración' },
  { id: 'gestion-docentes',  label: 'Docentes',          icon: <Users className="w-5 h-5" />,    roles: ['admin', 'director', 'subdirector'], category: 'Administración' },
  { id: 'gestion-alumnos',   label: 'Alumnos',           icon: <Users2 className="w-5 h-5" />,   roles: ['admin', 'director', 'subdirector'], category: 'Administración' },

  // ACADÉMICO
  { id: 'calificativos',      label: 'Calificativos', icon: <GraduationCap className="w-5 h-5" />, roles: ['admin', 'director', 'subdirector', 'teacher'], category: 'Académico' },
  { id: 'calificaciones',     label: 'Calificaciones',icon: <BookMarked className="w-5 h-5" />,    roles: ['teacher', 'student'],                         category: 'Académico' },
  { id: 'horario',            label: 'Horario',       icon: <Clock className="w-5 h-5" />,         roles: ['teacher', 'student'],                         category: 'Académico' },
  { id: 'asistencia',         label: 'Asistencia',    icon: <CheckSquare className="w-5 h-5" />,   roles: ['teacher', 'student'],                         category: 'Académico' },
  { id: 'dashboard-estudiante',label: 'Mi Desempeño', icon: <Flame className="w-5 h-5" />,        roles: ['student', 'parent'],                          category: 'Académico' },
  { id: 'normas-convivencia', label: 'Normas',        icon: <BookMarked className="w-5 h-5" />,    roles: ['student'],                                    category: 'Académico' },
];

export default function MainLayoutModern({
  user,
  onLogout,
  darkMode,
  setDarkMode,
  onNavigate,
  children,
}: MainLayoutModernProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null); // null = todas expandidas

  // Filtrar items por rol
  const visibleItems = allNavigationItems.filter(item =>
    item.roles.includes(user.role)
  );

  // Agrupar por categoría
  const itemsByCategory = visibleItems.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, typeof allNavigationItems>);

  const categoryOrder = ['Sistema', 'Principal', 'Administración', 'Académico'];

  const handleNavigation = (screenId: string) => {
    onNavigate(screenId);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900 transition-colors">
      {/* Top Bar */}
      <div className="sticky top-0 z-40 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="flex items-center justify-between h-16 px-6">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors md:hidden"
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <img src="/logo.png" alt="Logo Colegio" className="h-10 w-auto" />
            <span className="ml-2 font-bold text-slate-900 dark:text-white hidden sm:inline">
              EduGest {user.role === 'admin' ? '👑' : ''}
            </span>
          </div>

          {/* Top Bar Actions */}
          <div className="flex items-center gap-4">
            {/* Notifications */}
            <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors relative">
              <Bell className="w-5 h-5 text-slate-600 dark:text-slate-400" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>

            {/* Dark Mode Toggle */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              {darkMode ? (
                <Sun className="w-5 h-5 text-yellow-500" />
              ) : (
                <Moon className="w-5 h-5 text-slate-600" />
              )}
            </button>

            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white text-sm font-bold">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <span className="text-sm font-medium hidden sm:inline text-slate-700 dark:text-slate-300">
                  {user.name.split(' ')[0]}
                </span>
              </button>

              {/* User Dropdown Menu */}
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 z-50">
                  <div className="p-4 border-b border-slate-200 dark:border-slate-700">
                    <p className="font-semibold text-slate-900 dark:text-white text-sm">{user.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{user.email}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 capitalize">
                      {user.role === 'director'
                        ? 'Director'
                        : user.role === 'subdirector'
                          ? 'Subdirector'
                          : user.role === 'teacher'
                            ? 'Docente'
                            : user.role === 'student'
                              ? 'Estudiante'
                              : user.role === 'admin'
                                ? 'Administrador'
                                : 'Apoderado'}
                    </p>
                  </div>
                  <button className="w-full text-left px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 transition-colors">
                    <User className="w-4 h-4" />
                    Mi Perfil
                  </button>
                  <button className="w-full text-left px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 transition-colors border-b border-slate-200 dark:border-slate-700">
                    <Settings className="w-4 h-4" />
                    Configuración
                  </button>
                  <button
                    onClick={() => {
                      onLogout();
                      setShowUserMenu(false);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2 text-sm text-red-600 dark:text-red-400 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Cerrar Sesión
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex h-[calc(100vh-4rem)]">
        {/* Sidebar — siempre visible en desktop */}
        <div className="w-64 flex-shrink-0 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 overflow-y-auto">
          <div className="p-4 space-y-1">
            {categoryOrder.map(category => {
              const items = itemsByCategory[category];
              if (!items || items.length === 0) return null;
              return (
                <div key={category} className="mb-3">
                  <p className="px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    {category}
                  </p>
                  <div className="space-y-0.5">
                    {items.map(item => (
                      <button
                        key={item.id}
                        onClick={() => handleNavigation(item.id)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors text-sm font-medium"
                      >
                        {item.icon}
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}
