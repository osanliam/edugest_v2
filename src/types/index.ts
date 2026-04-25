export type UserRole = 'admin' | 'director' | 'subdirector' | 'teacher' | 'student' | 'parent';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  schoolId: string;
  docenteId?: string;
  avatar?: string;
  phone?: string;
  address?: string;
}

export interface Student {
  id: string;
  name: string;
  email: string;
  enrollmentNumber: string;
  gradeLevel: string;
  section: string;
  dateOfBirth: string;
  guardianId: string;
  enrollmentDate: string;
  status: 'active' | 'inactive' | 'graduated';
  avatar?: string;
}

export interface Teacher {
  id: string;
  name: string;
  email: string;
  specialization: string;
  hireDate: string;
  phone: string;
  status: 'active' | 'inactive' | 'on-leave';
  avatar?: string;
  courses: string[];
}

export interface Course {
  id: string;
  name: string;
  code: string;
  teacherId: string;
  gradeLevel: string;
  section: string;
  credits: number;
  schedule: Schedule;
  students: string[];
  description?: string;
}

export interface Schedule {
  id: string;
  courseId: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  room: string;
}

export interface Grade {
  id: string;
  studentId: string;
  courseId: string;
  teacherId: string;
  period: 'Q1' | 'Q2' | 'Q3' | 'Q4' | 'Final';
  competencies: Record<string, number>;
  average: number;
  remarks?: string;
  recordedDate: string;
}

export interface Attendance {
  id: string;
  studentId: string;
  courseId: string;
  date: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  remarks?: string;
}

export interface Message {
  id: string;
  senderId: string;
  recipientId: string;
  subject: string;
  body: string;
  attachments?: string[];
  sentDate: string;
  readDate?: string;
  isRead: boolean;
}

export interface Conversation {
  id: string;
  participants: string[];
  lastMessage: Message;
  unreadCount: number;
  updatedAt: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  authorId: string;
  createdAt: string;
  attachments?: string[];
  targetRole?: UserRole[];
  expiresAt?: string;
}

export interface ConductRule {
  id: string;
  title: string;
  description: string;
  category: 'positive' | 'negative';
  severity?: 'low' | 'medium' | 'high';
  consequences?: string[];
}

export interface StudentPerformance {
  studentId: string;
  gradeAverage: number;
  attendanceRate: number;
  conductScore: number;
  strengths: string[];
  areasForImprovement: string[];
  teacherRemarks: string;
}

export interface SchoolInfo {
  id: string;
  name: string;
  code: string;
  address: string;
  phone: string;
  email: string;
  website?: string;
  logo?: string;
  establishedYear: number;
  principalName: string;
}
