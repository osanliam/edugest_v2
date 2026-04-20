// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
import { mockLogin, mockGetStudents, mockGetGrades, mockGetAttendance, mockGetCourses, mockGetUsers, mockGetStats } from './mockAuth';

// Helper para hacer requests con autenticación
async function apiRequest(endpoint: string, options: RequestInit = {}) {
  const token = localStorage.getItem('auth_token');

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error en la solicitud');
    }

    return response.json();
  } catch (error) {
    // Fallback a mock data si backend no está disponible
    console.warn('Backend no disponible, usando MOCK DATA');
    throw error;
  }
}

// ============================================
// AUTH ENDPOINTS
// ============================================

export async function login(email: string, password: string) {
  try {
    const data = await apiRequest('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (data.token) {
      localStorage.setItem('auth_token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
    }

    return data;
  } catch (error) {
    // Fallback a mock auth si backend no está disponible
    const data = await mockLogin(email, password);
    if (data.token) {
      localStorage.setItem('auth_token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
    }
    return data;
  }
}

export async function verifyToken() {
  try {
    return await apiRequest('/api/auth/verify');
  } catch (error) {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    throw error;
  }
}

export function logout() {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('user');
}

// ============================================
// STUDENTS ENDPOINTS
// ============================================

export async function getStudents() {
  try {
    return await apiRequest('/api/students');
  } catch (error) {
    return await mockGetStudents();
  }
}

export async function getStudent(id: string) {
  return apiRequest(`/api/students/${id}`);
}

export async function createStudent(data: {
  email: string;
  name: string;
  enrollment_number: string;
  grade_level: string;
  section: string;
  password: string;
}) {
  return apiRequest('/api/students', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateStudent(
  id: string,
  data: {
    grade_level?: string;
    section?: string;
    status?: string;
  }
) {
  return apiRequest(`/api/students/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteStudent(id: string) {
  return apiRequest(`/api/students/${id}`, {
    method: 'DELETE',
  });
}

// ============================================
// GRADES ENDPOINTS
// ============================================

export async function getGrades(filters?: {
  student_id?: string;
  course_id?: string;
  teacher_id?: string;
}) {
  try {
    const params = new URLSearchParams();
    if (filters?.student_id) params.append('student_id', filters.student_id);
    if (filters?.course_id) params.append('course_id', filters.course_id);
    if (filters?.teacher_id) params.append('teacher_id', filters.teacher_id);

    const query = params.toString() ? `?${params.toString()}` : '';
    return await apiRequest(`/api/grades${query}`);
  } catch (error) {
    return await mockGetGrades();
  }
}

export async function getGrade(id: string) {
  return apiRequest(`/api/grades/${id}`);
}

export async function createGrade(data: {
  student_id: string;
  course_id: string;
  teacher_id?: string;
  period: string;
  score: number;
}) {
  return apiRequest('/api/grades', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateGrade(
  id: string,
  data: {
    score?: number;
    period?: string;
  }
) {
  return apiRequest(`/api/grades/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

// ============================================
// ATTENDANCE ENDPOINTS
// ============================================

export async function getAttendance(filters?: {
  student_id?: string;
  course_id?: string;
  start_date?: string;
  end_date?: string;
}) {
  try {
    const params = new URLSearchParams();
    if (filters?.student_id) params.append('student_id', filters.student_id);
    if (filters?.course_id) params.append('course_id', filters.course_id);
    if (filters?.start_date) params.append('start_date', filters.start_date);
    if (filters?.end_date) params.append('end_date', filters.end_date);

    const query = params.toString() ? `?${params.toString()}` : '';
    return await apiRequest(`/api/attendance${query}`);
  } catch (error) {
    return await mockGetAttendance();
  }
}

export async function getAttendanceStats(studentId: string) {
  return apiRequest(`/api/attendance/stats/${studentId}`);
}

export async function createAttendance(data: {
  student_id: string;
  course_id: string;
  date: string;
  status: 'present' | 'absent' | 'late';
}) {
  return apiRequest('/api/attendance', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateAttendance(
  id: string,
  data: {
    status: 'present' | 'absent' | 'late';
  }
) {
  return apiRequest(`/api/attendance/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

// ============================================
// ADMIN ENDPOINTS (Solo para admin)
// ============================================

export async function getAdminUsers() {
  try {
    return await apiRequest('/api/admin/users');
  } catch (error) {
    return await mockGetUsers();
  }
}

export async function getAdminUser(id: string) {
  return apiRequest(`/api/admin/users/${id}`);
}

export async function createAdminUser(data: {
  name: string;
  email: string;
  role: string;
  password: string;
  school_id?: string;
  phone?: string;
  address?: string;
}) {
  return apiRequest('/api/admin/users', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateAdminUser(
  id: string,
  data: {
    name?: string;
    role?: string;
    status?: string;
    phone?: string;
    address?: string;
  }
) {
  return apiRequest(`/api/admin/users/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteAdminUser(id: string) {
  return apiRequest(`/api/admin/users/${id}`, {
    method: 'DELETE',
  });
}

export async function getAdminStats() {
  try {
    return await apiRequest('/api/admin/stats');
  } catch (error) {
    return await mockGetStats();
  }
}

export async function getAuditLogs() {
  return apiRequest('/api/admin/audit-logs');
}

// ============================================
// COURSES ENDPOINTS
// ============================================

export async function getCourses(filters?: {
  school_id?: string;
  grade_level?: string;
}) {
  try {
    const params = new URLSearchParams();
    if (filters?.school_id) params.append('school_id', filters.school_id);
    if (filters?.grade_level) params.append('grade_level', filters.grade_level);

    const query = params.toString() ? `?${params.toString()}` : '';
    return await apiRequest(`/api/courses${query}`);
  } catch (error) {
    return await mockGetCourses();
  }
}

export async function getCourse(id: string) {
  return apiRequest(`/api/courses/${id}`);
}

export async function createCourse(data: {
  name: string;
  code: string;
  grade_level: string;
  semester?: string;
  credits?: number;
}) {
  return apiRequest('/api/courses', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateCourse(
  id: string,
  data: {
    name?: string;
    semester?: string;
    credits?: number;
    status?: string;
  }
) {
  return apiRequest(`/api/courses/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export default {
  // Auth
  login,
  logout,
  verifyToken,
  // Admin
  getAdminUsers,
  getAdminUser,
  createAdminUser,
  updateAdminUser,
  deleteAdminUser,
  getAdminStats,
  getAuditLogs,
  // Students
  getStudents,
  getStudent,
  createStudent,
  updateStudent,
  deleteStudent,
  // Grades
  getGrades,
  getGrade,
  createGrade,
  updateGrade,
  // Attendance
  getAttendance,
  getAttendanceStats,
  createAttendance,
  updateAttendance,
  // Courses
  getCourses,
  getCourse,
  createCourse,
  updateCourse,
};
