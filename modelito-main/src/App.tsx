/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  LayoutDashboard,
  BookOpen,
  MessageSquare,
  UserCircle,
  Settings,
  LogOut,
  GraduationCap,
  Users,
  Binary,
  ShieldCheck,
  BarChart3,
  Clock,
  FileText,
  CheckSquare,
  Network
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/src/lib/utils';
import { Navbar } from './components/layout/Navbar';
import { Login } from './components/screens/Login';
import { Dashboard } from './components/screens/Dashboard';
import { Classroom } from './components/screens/Classroom';
import { Messaging } from './components/screens/Messaging';
import { StudentHUD } from './components/screens/StudentHUD';
import { AdminPanel } from './components/screens/AdminPanel';
import { Grades } from './components/screens/Grades';
import { Schedule } from './components/screens/Schedule';
import { Reports } from './components/screens/Reports';
import { Attendance } from './components/screens/Attendance';
import { Faculty } from './components/screens/Faculty';
import { Students } from './components/screens/Students';
import { DirectorDash } from './components/screens/DirectorDash';
import { Conduct } from './components/screens/Conduct';

type UserRole = 'admin' | 'director' | 'subdirector' | 'teacher' | 'student' | 'parent';
type Screen = 'dashboard' | 'classroom' | 'messaging' | 'student-hud' | 'admin' | 'grades' | 'schedule' | 'reports' | 'attendance' | 'faculty' | 'students' | 'director' | 'conduct' | 'login';

interface User {
  name: string;
  role: UserRole;
  email: string;
}

const DEMO_USERS = {
  admin: { name: 'Admin System', role: 'admin' as UserRole, email: 'admin@escuela.edu' },
  director: { name: 'Dr. Evelyn Reed', role: 'director' as UserRole, email: 'director@escuela.edu' },
  teacher: { name: 'Prof. James Mitchell', role: 'teacher' as UserRole, email: 'teacher@escuela.edu' },
  student: { name: 'Alex Rivera', role: 'student' as UserRole, email: 'student@escuela.edu' },
  parent: { name: 'Maria Santos', role: 'parent' as UserRole, email: 'parent@escuela.edu' },
};

const ROLE_ACCESS: Record<UserRole, Screen[]> = {
  admin: ['dashboard', 'admin', 'grades', 'schedule', 'reports', 'attendance', 'faculty', 'students', 'director', 'classroom', 'messaging', 'student-hud', 'conduct'],
  director: ['dashboard', 'director', 'reports', 'faculty', 'students', 'attendance', 'conduct'],
  subdirector: ['dashboard', 'reports', 'faculty', 'students', 'attendance'],
  teacher: ['dashboard', 'classroom', 'grades', 'schedule', 'messaging', 'attendance'],
  student: ['dashboard', 'classroom', 'grades', 'schedule', 'messaging', 'student-hud'],
  parent: ['dashboard', 'messaging', 'student-hud'],
};

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeScreen, setActiveScreen] = useState<Screen>('dashboard');

  if (!isLoggedIn) {
    return <Login
      onLogin={(role: UserRole) => {
        const user = DEMO_USERS[role];
        setCurrentUser(user);
        setIsLoggedIn(true);
        setActiveScreen('dashboard');
      }}
    />;
  }

  if (!currentUser) {
    return <Login onLogin={() => {}} />;
  }

  const allowedScreens = ROLE_ACCESS[currentUser.role] || [];

  const allMenuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard /> },
    { id: 'admin', label: 'Admin Panel', icon: <ShieldCheck /> },
    { id: 'classroom', label: 'Virtual Class', icon: <BookOpen /> },
    { id: 'messaging', label: 'Neural Mesh', icon: <MessageSquare /> },
    { id: 'student-hud', label: 'Personal HUD', icon: <UserCircle /> },
    { id: 'grades', label: 'Grades', icon: <Binary /> },
    { id: 'schedule', label: 'Schedule', icon: <Clock /> },
    { id: 'faculty', label: 'Faculty', icon: <Users /> },
    { id: 'students', label: 'Students', icon: <GraduationCap /> },
    { id: 'attendance', label: 'Attendance', icon: <CheckSquare /> },
    { id: 'director', label: 'Director Dash', icon: <BarChart3 /> },
    { id: 'reports', label: 'Reports', icon: <FileText /> },
    { id: 'conduct', label: 'Conduct', icon: <Network /> },
  ];

  const menuItems = allMenuItems.filter((item) => allowedScreens.includes(item.id as Screen)) as Array<{ id: string; label: string; icon: React.ReactNode }>;

  return (
    <div className="h-screen flex flex-col bg-cyber-bg text-gray-700 overflow-hidden font-sans">
      <Navbar userName={currentUser.name} userRole={currentUser.role} />

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <aside className="w-20 lg:w-64 border-r border-cyber-border/40 bg-white/40 backdrop-blur-md flex flex-col p-4 animate-in slide-in-from-left duration-500">
          <div className="flex-1 space-y-2">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveScreen(item.id as Screen)}
                className={cn(
                  "w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all group relative",
                  activeScreen === item.id
                    ? "bg-cyber-cyan/20 text-cyber-cyan border border-cyber-cyan/50 shadow-md"
                    : "text-gray-600 hover:text-gray-800 hover:bg-white/20"
                )}
              >
                <div className={cn(
                  "shrink-0 transition-transform group-hover:scale-110",
                  activeScreen === item.id ? "text-cyber-cyan" : "text-gray-500"
                )}>
                  {React.cloneElement(item.icon as React.ReactElement, { size: 20 })}
                </div>
                <span className="hidden lg:block text-sm font-semibold tracking-wide uppercase font-mono">
                  {item.label}
                </span>
                
                {activeScreen === item.id && (
                  <motion.div
                    layoutId="active-pill"
                    className="absolute left-0 w-1 h-6 bg-cyber-cyan rounded-r-full shadow-[0_0_10px_rgba(0,242,255,1)]"
                  />
                )}
              </button>
            ))}
          </div>

          <div className="space-y-1">
            <button className="w-full flex items-center gap-4 px-4 py-3 rounded-xl text-gray-600 hover:text-gray-800 hover:bg-white/20 transition-all">
              <Settings size={20} />
              <span className="hidden lg:block text-sm font-mono uppercase tracking-widest">Settings</span>
            </button>
            <button
              onClick={() => {
                setIsLoggedIn(false);
                setCurrentUser(null);
                setActiveScreen('dashboard');
              }}
              className="w-full flex items-center gap-4 px-4 py-3 rounded-xl text-gray-600 hover:text-cyber-magenta hover:bg-cyber-magenta/10 transition-all"
            >
              <LogOut size={20} />
              <span className="hidden lg:block text-sm font-mono uppercase tracking-widest">Log Out</span>
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-6 relative">
          <div className="max-w-7xl mx-auto h-full">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeScreen}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="h-full"
              >
                {activeScreen === 'dashboard' && <Dashboard />}
                {activeScreen === 'classroom' && <Classroom />}
                {activeScreen === 'messaging' && <Messaging />}
                {activeScreen === 'student-hud' && <StudentHUD />}
                {activeScreen === 'admin' && <AdminPanel />}
                {activeScreen === 'grades' && <Grades />}
                {activeScreen === 'schedule' && <Schedule />}
                {activeScreen === 'reports' && <Reports />}
                {activeScreen === 'attendance' && <Attendance />}
                {activeScreen === 'faculty' && <Faculty />}
                {activeScreen === 'students' && <Students />}
                {activeScreen === 'director' && <DirectorDash />}
                {activeScreen === 'conduct' && <Conduct />}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Circuit Decor */}
          <div className="fixed bottom-0 right-0 w-64 h-64 opacity-5 pointer-events-none grayscale invert select-none">
            <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
              <path fill="currentColor" d="M40 40h40v40H40zm80 0h40v40h-40zM40 120h40v40H40zm80 0h40v40h-40z" />
              <path stroke="currentColor" strokeWidth="2" d="M60 80v40M140 80v40M80 60h40M80 140h40" />
            </svg>
          </div>
        </main>
      </div>

      {/* Ticker Footer */}
      <footer className="h-8 border-t border-cyber-border/20 bg-cyber-bg/80 backdrop-blur-sm flex items-center px-6 overflow-hidden">
        <div className="flex items-center gap-8 animate-[marquee_30s_linear_infinite] whitespace-nowrap">
          {[
            "SYSTEM STATUS: ALL CORE MODULES OPTIMIZED",
            "NEXT LIVE SESSION: NEURAL ETHICS STARTS IN T-MINUS 2H",
            "SECURITY ALERT: BIOMETRIC AUTHENTICATION REQUIRED FOR LAB 4",
            "LATEST ENROLLMENT TRENDS SHOW 15% SURGE IN AI INTEREST",
            "CLOUD HUB LOAD: 42% (STABLE)",
            "ADMIN ACTION REQUIRED: REVIEW ANNUAL INFRASTRUCTURE BUDGET"
          ].map((msg, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-1 h-1 bg-cyber-cyan rounded-full shadow-[0_0_5px_rgba(0,242,255,1)]" />
              <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">{msg}</span>
            </div>
          ))}
        </div>
      </footer>
    </div>
  );
}
