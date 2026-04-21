import { useState, useEffect } from 'react';
import { loadSystemData } from './services/dataService';
import LoginScreen from './screens/LoginScreen';
import AdminPanelScreen from './screens/AdminPanelScreen';
import AdminPanelScreenModern from './screens/AdminPanelScreenModern';
import DashboardScreen from './screens/DashboardScreen';
import DashboardUltraModern from './screens/DashboardUltraModern';
import VirtualClassroomScreen from './screens/VirtualClassroomScreen';
import VirtualClassroomScreenModern from './screens/VirtualClassroomScreenModern';
import MessagingScreen from './screens/MessagingScreen';
import ReportsScreen from './screens/ReportsScreen';
import ReportsScreenModern from './screens/ReportsScreenModern';
import DirectorDashboard from './screens/DirectorDashboard';
import DirectorDashboardModern from './screens/DirectorDashboardModern';
import SubdirectorDashboard from './screens/SubdirectorDashboard';
import CommunityScreen from './screens/CommunityScreen';
import TeachersScreen from './screens/TeachersScreen';
import TeachersScreenModern from './screens/TeachersScreenModern';
import StudentsScreen from './screens/StudentsScreen';
import StudentsScreenModern from './screens/StudentsScreenModern';
import StudentDashboard from './screens/StudentDashboard';
import GradesScreen from './screens/GradesScreen';
import GradesScreenModern from './screens/GradesScreenModern';
import ScheduleScreen from './screens/ScheduleScreen';
import ScheduleScreenModern from './screens/ScheduleScreenModern';
import AttendanceScreen from './screens/AttendanceScreen';
import AttendanceScreenModern from './screens/AttendanceScreenModern';
import ConductRulesScreen from './screens/ConductRulesScreen';
import CalificativosScreen from './screens/CalificativosScreen';
import AdminUsersScreen from './screens/AdminUsersScreen';
import GradesScreenAPI from './screens/GradesScreenAPI';
import CalificacionesProModerno from './screens/CalificacionesProModerno';
import DocentesScreen from './screens/DocentesScreen';
import AlumnosScreen from './screens/AlumnosScreen';
import MainLayoutModern from './components/MainLayoutModern';

type UserRole = 'admin' | 'director' | 'subdirector' | 'teacher' | 'student' | 'parent';

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  schoolId: string;
}

type ScreenType = 'login' | 'panel-admin' | 'inicio' | 'inicio-modern' | 'aula-virtual' | 'mensajes' | 'informes' |
                 'panel-director' | 'panel-subdirector' | 'comunidad' | 'profesores' |
                 'estudiantes' | 'dashboard-estudiante' | 'calificaciones' | 'horario' |
                 'asistencia' | 'normas-convivencia' | 'gestionar-usuarios' |
                 'gestion-docentes' | 'gestion-alumnos';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [currentScreen, setCurrentScreen] = useState<ScreenType>('login');
  const [isLoading, setIsLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    // Cargar datos del sistema al iniciar
    loadSystemData().then(() => {
      // Verificar si hay usuario autenticado
      const storedUser = localStorage.getItem('user');
      const storedDarkMode = localStorage.getItem('darkMode');

      if (storedUser) {
        try {
          const userData = JSON.parse(storedUser);
          setUser(userData);
          setCurrentScreen('inicio');
        } catch (e) {
          localStorage.removeItem('user');
        }
      }

      if (storedDarkMode) {
        setDarkMode(JSON.parse(storedDarkMode));
      }

      setIsLoading(false);
    });
  }, []);

  useEffect(() => {
    // Aplicar dark mode al body
    if (darkMode) {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
  }, [darkMode]);

  const handleLogin = (userData: User) => {
    setUser(userData);
    setCurrentScreen('inicio');
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    setCurrentScreen('login');
    localStorage.removeItem('user');
  };

  const canAccessScreen = (screen: ScreenType): boolean => {
    if (!user) return screen === 'login';

    const roleAccess: Record<UserRole, ScreenType[]> = {
      admin: [
        'panel-admin', 'inicio', 'inicio-modern', 'aula-virtual', 'mensajes', 'informes', 'comunidad',
        'panel-director', 'panel-subdirector', 'profesores', 'estudiantes', 'calificaciones',
        'gestionar-usuarios', 'gestion-docentes', 'gestion-alumnos'
      ],
      director: [
        'inicio', 'inicio-modern', 'aula-virtual', 'mensajes', 'informes', 'comunidad',
        'panel-director', 'profesores', 'estudiantes', 'gestion-docentes', 'gestion-alumnos'
      ],
      subdirector: [
        'inicio', 'inicio-modern', 'aula-virtual', 'mensajes', 'informes', 'comunidad',
        'panel-subdirector', 'panel-director', 'profesores', 'estudiantes', 'gestion-docentes', 'gestion-alumnos'
      ],
      teacher: [
        'inicio', 'inicio-modern', 'aula-virtual', 'mensajes', 'informes', 'comunidad',
        'calificaciones', 'horario', 'asistencia'
      ],
      student: [
        'inicio', 'inicio-modern', 'aula-virtual', 'mensajes', 'informes', 'comunidad',
        'dashboard-estudiante', 'calificaciones', 'horario', 'asistencia',
        'normas-convivencia'
      ],
      parent: [
        'inicio', 'inicio-modern', 'mensajes', 'informes', 'comunidad',
        'dashboard-estudiante'
      ]
    };

    return roleAccess[user.role]?.includes(screen) || false;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full border-4 border-slate-300 dark:border-slate-700 border-t-red-600 animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400 text-sm font-medium">Cargando EduGest...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  if (!canAccessScreen(currentScreen)) {
    setCurrentScreen('inicio');
    return null;
  }

  return (
    <>
      {currentScreen === 'inicio-modern' && <DashboardUltraModern />}
      {currentScreen !== 'inicio-modern' && (
        <MainLayoutModern user={user} onLogout={handleLogout} darkMode={darkMode} setDarkMode={setDarkMode} onNavigate={setCurrentScreen}>
          {currentScreen === 'panel-admin' && <AdminPanelScreenModern />}
          {currentScreen === 'inicio' && <DashboardScreen user={user} />}
          {currentScreen === 'aula-virtual' && <VirtualClassroomScreenModern />}
      {currentScreen === 'mensajes' && <MessagingScreen user={user} />}
      {currentScreen === 'informes' && <ReportsScreenModern user={user} />}
      {currentScreen === 'panel-director' && <DirectorDashboardModern user={user} />}
      {currentScreen === 'panel-subdirector' && <SubdirectorDashboard user={user} />}
      {currentScreen === 'comunidad' && <CommunityScreen user={user} />}
      {currentScreen === 'profesores' && <TeachersScreenModern user={user} />}
      {currentScreen === 'estudiantes' && <StudentsScreenModern user={user} />}
      {currentScreen === 'dashboard-estudiante' && <StudentDashboard user={user} />}
      {currentScreen === 'calificaciones' && <CalificacionesProModerno />}
      {currentScreen === 'gestionar-usuarios' && <AdminUsersScreen />}
      {currentScreen === 'gestion-docentes' && <DocentesScreen />}
      {currentScreen === 'gestion-alumnos' && <AlumnosScreen />}
          {currentScreen === 'horario' && <ScheduleScreenModern user={user} />}
          {currentScreen === 'asistencia' && <AttendanceScreenModern user={user} />}
          {currentScreen === 'normas-convivencia' && <ConductRulesScreen user={user} />}
        </MainLayoutModern>
      )}
    </>
  );
}
