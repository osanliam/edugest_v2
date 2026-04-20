import { useState } from 'react';
import {
  Menu, X, LogOut, Moon, Sun, Bell, User, BarChart3, Users,
  BookOpen, MessageSquare, Home, Settings, Building2, Users2,
  Flame, Clock, CheckSquare, BookMarked, Shield
} from 'lucide-react';
import { User as UserType } from '../types';

interface MainLayoutProps {
  user: UserType;
  onLogout: () => void;
  darkMode: boolean;
  setDarkMode: (dark: boolean) => void;
  onNavigate: (screen: string) => void;
  children: React.ReactNode;
}

const navigationItems: Record<string, Array<{ id: string; label: string; icon: React.ReactNode; roles: string[] }>> = {
  system: [
    { id: 'panel-admin', label: 'Panel Admin', icon: <Shield className="w-5 h-5" />, roles: ['admin'] },
  ],
  main: [
    { id: 'inicio', label: 'Inicio', icon: <Home className="w-5 h-5" />, roles: ['admin', 'director', 'subdirector', 'teacher', 'student', 'parent'] },
    { id: 'aula-virtual', label: 'Aula Virtual', icon: <BookOpen className="w-5 h-5" />, roles: ['admin', 'director', 'subdirector', 'teacher', 'student'] },
    { id: 'mensajes', label: 'Mensajes', icon: <MessageSquare className="w-5 h-5" />, roles: ['admin', 'director', 'subdirector', 'teacher', 'student', 'parent'] },
    { id: 'informes', label: 'Informes', icon: <BarChart3 className="w-5 h-5" />, roles: ['admin', 'director', 'subdirector', 'teacher', 'student', 'parent'] },
    { id: 'comunidad', label: 'Comunidad', icon: <Users2 className="w-5 h-5" />, roles: ['admin', 'director', 'subdirector', 'teacher', 'student', 'parent'] },
  ],
  admin: [
    { id: 'panel-director', label: 'Panel Director', icon: <Building2 className="w-5 h-5" />, roles: ['admin', 'director', 'subdirector'] },
    { id: 'panel-subdirector', label: 'Panel Subdirector', icon: <Users className="w-5 h-5" />, roles: ['admin', 'subdirector'] },
    { id: 'profesores', label: 'Profesores', icon: <Users className="w-5 h-5" />, roles: ['admin', 'director', 'subdirector'] },
    { id: 'estudiantes', label: 'Estudiantes', icon: <Users2 className="w-5 h-5" />, roles: ['admin', 'director', 'subdirector'] },
  ],
  academic: [
    { id: 'dashboard-estudiante', label: 'Mi Desempeño', icon: <Flame className="w-5 h-5" />, roles: ['student', 'parent'] },
    { id: 'calificaciones', label: 'Calificaciones', icon: <BookMarked className="w-5 h-5" />, roles: ['teacher', 'student'] },
    { id: 'horario', label: 'Horario', icon: <Clock className="w-5 h-5" />, roles: ['teacher', 'student'] },
    { id: 'asistencia', label: 'Asistencia', icon: <CheckSquare className="w-5 h-5" />, roles: ['teacher', 'student'] },
    { id: 'normas-convivencia', label: 'Normas', icon: <BookMarked className="w-5 h-5" />, roles: ['student'] },
  ]
};

export default function MainLayout({ user, onLogout, darkMode, setDarkMode, onNavigate, children }: MainLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const getFilteredNavItems = (items: typeof navigationItems.main) => {
    return items.filter(item => item.roles.includes(user.role));
  };

  const systemNavItems = getFilteredNavItems(navigationItems.system);
  const mainNavItems = getFilteredNavItems(navigationItems.main);
  const adminNavItems = getFilteredNavItems(navigationItems.admin);
  const academicNavItems = getFilteredNavItems(navigationItems.academic);

  const handleNavigation = (screenId: string) => {
    onNavigate(screenId);
    setSidebarOpen(false);
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
                      {user.role === 'director' ? 'Director' :
                       user.role === 'subdirector' ? 'Subdirector' :
                       user.role === 'teacher' ? 'Docente' :
                       user.role === 'student' ? 'Estudiante' : 'Apoderado'}
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
        {/* Sidebar */}
        <div
          className={`${
            sidebarOpen ? 'w-64' : 'w-0'
          } bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 overflow-hidden transition-all duration-300 md:w-64`}
        >
          <div className="overflow-y-auto h-full p-4">
            {/* System Navigation (Admin Only) */}
            {systemNavItems.length > 0 && (
              <div className="mb-6">
                <p className="text-xs font-semibold text-red-600 dark:text-red-500 uppercase tracking-wider mb-2 px-2">
                  🔐 Sistema
                </p>
                <div className="space-y-1">
                  {systemNavItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleNavigation(item.id)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-red-700 dark:text-red-400 transition-colors text-sm font-medium"
                    >
                      {item.icon}
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Main Navigation */}
            <div className="mb-6">
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 px-2">
                Navegación
              </p>
              <div className="space-y-1">
                {mainNavItems.map((item) => (
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

            {/* Admin Navigation */}
            {adminNavItems.length > 0 && (
              <div className="mb-6">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 px-2">
                  Administración
                </p>
                <div className="space-y-1">
                  {adminNavItems.map((item) => (
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
            )}

            {/* Academic Navigation */}
            {academicNavItems.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 px-2">
                  Académico
                </p>
                <div className="space-y-1">
                  {academicNavItems.map((item) => (
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
            )}
          </div>
        </div>

        {/* Mobile Overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 md:hidden z-30"
            onClick={() => setSidebarOpen(false)}
          ></div>
        )}

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}
