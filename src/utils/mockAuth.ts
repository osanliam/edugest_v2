// Mock Authentication - Para desarrollo sin backend
import { User as UserType } from '../types';

const mockUsers = [
  {
    id: 'user-admin',
    name: 'Administrador del Sistema',
    email: 'admin@manuelfidencio.edu.pe',
    password: 'admin123',
    role: 'admin' as const,
    school_id: 'school-001'
  },
  {
    id: 'user-001',
    name: 'Dr. Fernando López',
    email: 'director@escuela.edu',
    password: 'director123',
    role: 'director' as const,
    school_id: 'school-001'
  },
  {
    id: 'user-002',
    name: 'Mg. María García',
    email: 'subdirector@escuela.edu',
    password: 'sub123',
    role: 'subdirector' as const,
    school_id: 'school-001'
  },
  {
    id: 'user-003',
    name: 'Lic. Juan Pérez',
    email: 'profesor@escuela.edu',
    password: 'prof123',
    role: 'teacher' as const,
    school_id: 'school-001'
  },
  {
    id: 'user-004',
    name: 'Carlos Mendez',
    email: 'estudiante@escuela.edu',
    password: 'est123',
    role: 'student' as const,
    school_id: 'school-001'
  },
  {
    id: 'user-005',
    name: 'Pedro Mendez',
    email: 'apoderado@escuela.edu',
    password: 'apod123',
    role: 'parent' as const,
    school_id: 'school-001'
  }
];

export async function mockLogin(email: string, password: string) {
  // Simula delay de red
  await new Promise(resolve => setTimeout(resolve, 300));

  const user = mockUsers.find(u => u.email === email);

  if (!user || user.password !== password) {
    throw new Error('Email o contraseña incorrectos');
  }

  // Simula JWT token
  const mockToken = `mock_token_${user.id}_${Date.now()}`;

  return {
    success: true,
    token: mockToken,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      school_id: user.school_id
    }
  };
}

export async function mockGetStudents() {
  await new Promise(resolve => setTimeout(resolve, 200));
  return {
    success: true,
    data: [
      { id: 'st-1', name: 'Carlos Mendez', email: 'carlos@escuela.edu', enrollment_number: 'EST-001', grade_level: '3°A', section: 'A' },
      { id: 'st-2', name: 'María García', email: 'maria@escuela.edu', enrollment_number: 'EST-002', grade_level: '3°A', section: 'A' },
      { id: 'st-3', name: 'Juan Pérez', email: 'juan@manuelfidencio.edu.pe', enrollment_number: 'EST-003', grade_level: '3°B', section: 'B' },
    ]
  };
}

export async function mockGetGrades() {
  await new Promise(resolve => setTimeout(resolve, 200));
  return {
    success: true,
    data: [
      { id: 'g-1', course: 'Matemáticas', score: 18, max_score: 20, period: 'Q4', teacher: 'Prof. García', weight: 15 },
      { id: 'g-2', course: 'Lenguaje', score: 17, max_score: 20, period: 'Q4', teacher: 'Prof. López', weight: 15 },
      { id: 'g-3', course: 'Ciencias', score: 19, max_score: 20, period: 'Q4', teacher: 'Prof. Rodríguez', weight: 15 },
    ]
  };
}

export async function mockGetAttendance() {
  await new Promise(resolve => setTimeout(resolve, 200));
  return {
    success: true,
    data: [
      { id: 'a-1', date: '2024-04-19', status: 'present', course: 'Matemáticas' },
      { id: 'a-2', date: '2024-04-18', status: 'present', course: 'Lenguaje' },
      { id: 'a-3', date: '2024-04-17', status: 'late', course: 'Ciencias' },
    ]
  };
}

export async function mockGetCourses() {
  await new Promise(resolve => setTimeout(resolve, 200));
  return {
    success: true,
    data: [
      { id: 'c-1', name: 'Matemáticas', code: 'MAT-101', grade_level: '3°', semester: 'Q4', credits: 4 },
      { id: 'c-2', name: 'Lenguaje', code: 'LEN-101', grade_level: '3°', semester: 'Q4', credits: 4 },
      { id: 'c-3', name: 'Ciencias', code: 'CIN-101', grade_level: '3°', semester: 'Q4', credits: 4 },
    ]
  };
}

export async function mockGetUsers() {
  await new Promise(resolve => setTimeout(resolve, 200));
  return {
    success: true,
    data: mockUsers.map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      status: 'active',
      school_id: u.school_id
    }))
  };
}

export async function mockGetStats() {
  await new Promise(resolve => setTimeout(resolve, 200));
  return {
    success: true,
    data: {
      totalStudents: 342,
      totalTeachers: 28,
      totalCourses: 42,
      avgGPA: 3.8,
      attendanceRate: 92.5
    }
  };
}
