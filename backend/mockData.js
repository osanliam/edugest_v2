// Mock Data para desarrollo y testing sin BD real

export const mockStudents = [
  {
    id: 'student-1',
    user_id: 'user-004',
    enrollment_number: 'EST-2024-001',
    grade_level: '3°A',
    section: 'A',
    status: 'active',
    name: 'Carlos Mendez',
    email: 'estudiante@escuela.edu'
  },
  {
    id: 'student-2',
    user_id: 'user-004',
    enrollment_number: 'EST-2024-002',
    grade_level: '3°A',
    section: 'A',
    status: 'active',
    name: 'María García',
    email: 'maria.garcia@escuela.edu'
  },
  {
    id: 'student-3',
    user_id: 'user-004',
    enrollment_number: 'EST-2024-003',
    grade_level: '3°B',
    section: 'B',
    status: 'active',
    name: 'Juan Pérez',
    email: 'juan.perez@escuela.edu'
  },
];

export const mockGrades = [
  {
    id: 'grade-1',
    student_id: 'student-1',
    course_id: 'course-1',
    score: 18,
    max_score: 20,
    period: 'Q4',
    teacher_id: 'user-003',
    teacher_name: 'Lic. Juan Pérez'
  },
  {
    id: 'grade-2',
    student_id: 'student-1',
    course_id: 'course-2',
    score: 17,
    max_score: 20,
    period: 'Q4',
    teacher_id: 'user-003',
    teacher_name: 'Lic. Juan Pérez'
  },
  {
    id: 'grade-3',
    student_id: 'student-1',
    course_id: 'course-3',
    score: 19,
    max_score: 20,
    period: 'Q4',
    teacher_id: 'user-003',
    teacher_name: 'Lic. Juan Pérez'
  },
];

export const mockAttendance = [
  {
    id: 'att-1',
    student_id: 'student-1',
    course_id: 'course-1',
    date: '2024-04-18',
    status: 'present'
  },
  {
    id: 'att-2',
    student_id: 'student-1',
    course_id: 'course-2',
    date: '2024-04-18',
    status: 'present'
  },
  {
    id: 'att-3',
    student_id: 'student-1',
    course_id: 'course-3',
    date: '2024-04-17',
    status: 'late'
  },
];

export const mockCourses = [
  {
    id: 'course-1',
    name: 'Matemáticas',
    code: 'MAT-101',
    grade_level: '3°',
    semester: 'Q4',
    credits: 4,
    teacher_id: 'user-003',
    teacher_name: 'Prof. García'
  },
  {
    id: 'course-2',
    name: 'Lenguaje',
    code: 'LEN-101',
    grade_level: '3°',
    semester: 'Q4',
    credits: 4,
    teacher_id: 'user-003',
    teacher_name: 'Prof. López'
  },
  {
    id: 'course-3',
    name: 'Ciencias',
    code: 'CIN-101',
    grade_level: '3°',
    semester: 'Q4',
    credits: 4,
    teacher_id: 'user-003',
    teacher_name: 'Prof. Rodríguez'
  },
];

export const mockUsers = [
  {
    id: 'user-admin',
    name: 'Administrador del Sistema',
    email: 'admin@escuela.edu',
    role: 'admin',
    school_id: 'school-001',
    status: 'active'
  },
  {
    id: 'user-001',
    name: 'Dr. Fernando López',
    email: 'director@escuela.edu',
    role: 'director',
    school_id: 'school-001',
    status: 'active'
  },
  {
    id: 'user-002',
    name: 'Mg. María García',
    email: 'subdirector@escuela.edu',
    role: 'subdirector',
    school_id: 'school-001',
    status: 'active'
  },
  {
    id: 'user-003',
    name: 'Lic. Juan Pérez',
    email: 'profesor@escuela.edu',
    role: 'teacher',
    school_id: 'school-001',
    status: 'active'
  },
  {
    id: 'user-004',
    name: 'Carlos Mendez',
    email: 'estudiante@escuela.edu',
    role: 'student',
    school_id: 'school-001',
    status: 'active'
  },
  {
    id: 'user-005',
    name: 'Pedro Mendez',
    email: 'apoderado@escuela.edu',
    role: 'parent',
    school_id: 'school-001',
    status: 'active'
  }
];

export const mockStats = {
  totalStudents: 342,
  totalTeachers: 28,
  totalCourses: 42,
  avgGPA: 3.8,
  attendanceRate: 92.5
};

export const mockAuditLogs = [
  {
    id: 'log-1',
    user_id: 'user-admin',
    action: 'LOGIN',
    resource: 'auth',
    timestamp: new Date().toISOString()
  },
  {
    id: 'log-2',
    user_id: 'user-001',
    action: 'VIEW_STUDENTS',
    resource: 'students',
    timestamp: new Date(Date.now() - 3600000).toISOString()
  }
];
