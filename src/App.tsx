import { useState, useEffect } from 'react';
import { loadSystemData } from './services/dataService';
import { setToken } from './utils/apiClient';
import LoginScreen from './screens/LoginScreen';
import AdminPanelScreen from './screens/AdminPanelScreen';
import AdminPanelScreenModern from './screens/AdminPanelScreenModern';
import AdminPanelScreenModern_v2 from './screens/AdminPanelScreenModern_v2';
import DashboardScreen from './screens/DashboardScreen';
import DashboardUltraModern from './screens/DashboardUltraModern';
import VirtualClassroomScreen from './screens/VirtualClassroomScreen';
import VirtualClassroomScreenModern from './screens/VirtualClassroomScreenModern';
import VirtualClassroomScreenModern_v2 from './screens/VirtualClassroomScreenModern_v2';
import MessagingScreen from './screens/MessagingScreen';
import ReportsScreen from './screens/ReportsScreen';
import ReportsScreenModern from './screens/ReportsScreenModern';
import ReportsScreenModern_v2 from './screens/ReportsScreenModern_v2';
import DirectorDashboard from './screens/DirectorDashboard';
import DirectorDashboardModern from './screens/DirectorDashboardModern';
import SubdirectorDashboard from './screens/SubdirectorDashboard';
import CommunityScreen from './screens/CommunityScreen';
import CommunityScreenModern from './screens/CommunityScreenModern';
import TeachersScreen from './screens/TeachersScreen';
import TeachersScreenModern from './screens/TeachersScreenModern';
import StudentsScreen from './screens/StudentsScreen';
import StudentsScreenModern from './screens/StudentsScreenModern';
import StudentDashboard from './screens/StudentDashboard';
import GradesScreen from './screens/GradesScreen';
import GradesScreenModern from './screens/GradesScreenModern';
import ScheduleScreen from './screens/ScheduleScreen';
import ScheduleScreenModern from './screens/ScheduleScreenModern';
import ScheduleScreenModern_v2 from './screens/ScheduleScreenModern_v2';
import AttendanceScreen from './screens/AttendanceScreen';
import AttendanceScreenModern from './screens/AttendanceScreenModern';
import AttendanceScreenModern_v2 from './screens/AttendanceScreenModern_v2';
import NormasConvivenciaScreen from './screens/NormasConvivenciaScreen';
import NormasConvivenciaModerno from './screens/NormasConvivenciaModerno';
import ConductRulesScreen from './screens/ConductRulesScreen';
import CalificativosScreen from './screens/CalificativosScreen';
import ReporteAlumnoScreen from './screens/ReporteAlumnoScreen';
import AdminUsersScreen from './screens/AdminUsersScreen';
import GradesScreenAPI from './screens/GradesScreenAPI';
import CalificacionesProModerno from './screens/CalificacionesProModerno';
import DocentesScreen from './screens/DocentesScreen';
import AlumnosScreen from './screens/AlumnosScreen';
import ConfiguracionScreen from './screens/ConfiguracionScreen';
import GroupsScreen from './screens/GroupsScreen';
import MainLayoutModern from './components/MainLayoutModern';

type UserRole = 'admin' | 'director' | 'subdirector' | 'teacher' | 'student' | 'parent';

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  schoolId: string;
  docenteId?: string;
}

type ScreenType = 'login' | 'panel-admin' | 'inicio' | 'inicio-modern' | 'aula-virtual' | 'mensajes' | 'informes' |
                 'panel-director' | 'panel-subdirector' | 'comunidad' | 'profesores' |
                 'estudiantes' | 'dashboard-estudiante' | 'calificaciones' | 'horario' |
                 'asistencia' | 'normas-convivencia' | 'gestionar-usuarios' |
                 'gestion-docentes' | 'gestion-alumnos' | 'calificativos' | 'configuracion' |
                 'reporte-alumno' | 'grupos';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [currentScreen, setCurrentScreen] = useState<ScreenType>('login');
  const [isLoading, setIsLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    // Restaurar sesión desde sessionStorage (no localStorage)
    const storedUser = sessionStorage.getItem('user');
    const storedToken = sessionStorage.getItem('auth_token');
    const storedDarkMode = localStorage.getItem('darkMode');

    if (storedUser && storedToken) {
      try {
        const userData = JSON.parse(storedUser);
        setToken(storedToken);
        setUser(userData);
        setCurrentScreen('inicio');
      } catch (e) {
        sessionStorage.removeItem('user');
        sessionStorage.removeItem('auth_token');
      }
    }

    if (storedDarkMode) {
      setDarkMode(JSON.parse(storedDarkMode));
    }

    setIsLoading(false);
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
    sessionStorage.setItem('user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    setCurrentScreen('login');
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('auth_token');
  };

  const canAccessScreen = (screen: ScreenType): boolean => {
    if (!user) return screen === 'login';

    const roleAccess: Record<UserRole, ScreenType[]> = {
      admin: [
        'panel-admin', 'inicio', 'inicio-modern', 'aula-virtual', 'mensajes', 'informes', 'comunidad',
        'panel-director', 'panel-subdirector', 'profesores', 'estudiantes', 'calificaciones',
        'gestionar-usuarios', 'gestion-docentes', 'gestion-alumnos', 'calificativos', 'configuracion',
        'horario', 'asistencia', 'normas-convivencia', 'reporte-alumno', 'grupos'
      ],
      director: [
        'inicio', 'inicio-modern', 'aula-virtual', 'mensajes', 'informes', 'comunidad',
        'panel-director', 'profesores', 'estudiantes', 'gestion-docentes', 'gestion-alumnos',
        'calificativos', 'configuracion', 'asistencia', 'normas-convivencia', 'grupos'
      ],
      subdirector: [
        'inicio', 'inicio-modern', 'aula-virtual', 'mensajes', 'informes', 'comunidad',
        'panel-subdirector', 'panel-director', 'profesores', 'estudiantes', 'gestion-docentes', 'gestion-alumnos',
        'calificativos', 'configuracion', 'asistencia', 'normas-convivencia', 'grupos'
      ],
      teacher: [
        'inicio', 'inicio-modern', 'aula-virtual', 'mensajes', 'informes', 'comunidad',
        'calificativos', 'horario', 'asistencia', 'normas-convivencia', 'grupos',
        'estudiantes', 'gestion-alumnos'
      ],
      student: [
        'inicio', 'inicio-modern', 'aula-virtual', 'mensajes', 'informes', 'comunidad',
        'dashboard-estudiante', 'horario', 'asistencia',
        'normas-convivencia'
      ],
      parent: [
        'inicio', 'inicio-modern', 'mensajes', 'informes', 'comunidad',
        'dashboard-estudiante', 'reporte-alumno'
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
    return <LoginScreen key="login-screen" onLogin={handleLogin} />;
  }

  if (!canAccessScreen(currentScreen)) {
    setCurrentScreen('inicio');
    return null;
  }

  return (
    <>
      {currentScreen === 'inicio-modern' && <DashboardUltraModern />}
      {currentScreen !== 'inicio-modern' && (
        <MainLayoutModern key={`layout-${user.id}`} user={user} onLogout={handleLogout} darkMode={darkMode} setDarkMode={setDarkMode} onNavigate={setCurrentScreen} currentScreen={currentScreen}>
          {currentScreen === 'panel-admin'         && <AdminPanelScreenModern_v2 />}
          {currentScreen === 'inicio'              && <DashboardScreen user={user} />}
          {currentScreen === 'aula-virtual'        && <VirtualClassroomScreenModern_v2 />}
          {currentScreen === 'mensajes'            && <MessagingScreen user={user} />}
          {currentScreen === 'informes'            && <ReportsScreenModern_v2 user={user} />}
          {currentScreen === 'panel-director'      && <DirectorDashboardModern user={user} />}
          {currentScreen === 'panel-subdirector'   && <SubdirectorDashboard user={user} />}
          {currentScreen === 'comunidad'           && <CommunityScreenModern user={user} />}
          {currentScreen === 'profesores'          && <TeachersScreenModern user={user} />}
          {currentScreen === 'estudiantes'         && <StudentsScreenModern user={user} />}
          {currentScreen === 'dashboard-estudiante'&& <StudentDashboard user={user} />}
          {currentScreen === 'calificaciones'      && <CalificativosScreen user={user} />}
          {currentScreen === 'gestionar-usuarios'  && <AdminUsersScreen user={user} />}
          {currentScreen === 'gestion-docentes'    && <DocentesScreen />}
          {currentScreen === 'gestion-alumnos'     && <AlumnosScreen user={user} />}
          {currentScreen === 'calificativos'       && <CalificativosScreen user={user} />}
          {currentScreen === 'configuracion'       && <ConfiguracionScreen />}
          {currentScreen === 'horario'             && <ScheduleScreenModern_v2 user={user} />}
          {currentScreen === 'asistencia'          && <AttendanceScreen />}
          {currentScreen === 'normas-convivencia'  && <NormasConvivenciaScreen />}
          {currentScreen === 'reporte-alumno'     && <ReporteAlumnoScreen user={user} />}
          {currentScreen === 'grupos'              && <GroupsScreen />}
        </MainLayoutModern>
      )}
    </>
  );
}
