-- ============================================
-- EduGest - Database Schema v1.0
-- IE Manuel Fidencio Hidalgo Flores
-- ============================================

-- Create database
CREATE DATABASE IF NOT EXISTS edugest_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE edugest_db;

-- ============================================
-- TABLA: Schools (Instituciones)
-- ============================================
CREATE TABLE schools (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) UNIQUE NOT NULL,
  address VARCHAR(500),
  phone VARCHAR(20),
  email VARCHAR(100),
  website VARCHAR(255),
  logo_url VARCHAR(500),
  established_year INT,
  principal_name VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ============================================
-- TABLA: Users (Usuarios del Sistema)
-- ============================================
CREATE TABLE users (
  id VARCHAR(36) PRIMARY KEY,
  school_id VARCHAR(36) NOT NULL,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('director', 'subdirector', 'teacher', 'student', 'parent') NOT NULL,
  phone VARCHAR(20),
  address VARCHAR(500),
  avatar_url VARCHAR(500),
  status ENUM('active', 'inactive', 'on-leave') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (school_id) REFERENCES schools(id),
  INDEX idx_role (role),
  INDEX idx_email (email),
  INDEX idx_status (status)
);

-- ============================================
-- TABLA: Students (Estudiantes)
-- ============================================
CREATE TABLE students (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL UNIQUE,
  school_id VARCHAR(36) NOT NULL,
  enrollment_number VARCHAR(50) UNIQUE NOT NULL,
  grade_level VARCHAR(20) NOT NULL,
  section VARCHAR(20),
  guardian_id VARCHAR(36),
  date_of_birth DATE,
  enrollment_date DATE,
  status ENUM('active', 'inactive', 'graduated', 'transferred') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (school_id) REFERENCES schools(id),
  FOREIGN KEY (guardian_id) REFERENCES users(id),
  INDEX idx_grade_level (grade_level),
  INDEX idx_section (section),
  INDEX idx_status (status)
);

-- ============================================
-- TABLA: Teachers (Docentes)
-- ============================================
CREATE TABLE teachers (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL UNIQUE,
  school_id VARCHAR(36) NOT NULL,
  specialization VARCHAR(255),
  hire_date DATE,
  status ENUM('active', 'inactive', 'on-leave') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (school_id) REFERENCES schools(id),
  INDEX idx_status (status)
);

-- ============================================
-- TABLA: Courses (Cursos)
-- ============================================
CREATE TABLE courses (
  id VARCHAR(36) PRIMARY KEY,
  school_id VARCHAR(36) NOT NULL,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) UNIQUE NOT NULL,
  teacher_id VARCHAR(36) NOT NULL,
  grade_level VARCHAR(20) NOT NULL,
  section VARCHAR(20),
  credits INT DEFAULT 3,
  description TEXT,
  semester INT,
  year INT,
  status ENUM('active', 'inactive', 'archived') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (school_id) REFERENCES schools(id),
  FOREIGN KEY (teacher_id) REFERENCES teachers(id),
  INDEX idx_grade_section (grade_level, section),
  INDEX idx_teacher (teacher_id)
);

-- ============================================
-- TABLA: Enrollments (Inscripciones)
-- ============================================
CREATE TABLE enrollments (
  id VARCHAR(36) PRIMARY KEY,
  student_id VARCHAR(36) NOT NULL,
  course_id VARCHAR(36) NOT NULL,
  enrollment_date DATE,
  status ENUM('active', 'dropped', 'completed') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_enrollment (student_id, course_id),
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
  INDEX idx_status (status)
);

-- ============================================
-- TABLA: Competencies (Competencias)
-- ============================================
CREATE TABLE competencies (
  id VARCHAR(36) PRIMARY KEY,
  school_id VARCHAR(36) NOT NULL,
  course_id VARCHAR(36) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  weight DECIMAL(5, 2) DEFAULT 100.00,
  order_number INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (school_id) REFERENCES schools(id),
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
  INDEX idx_course (course_id)
);

-- ============================================
-- TABLA: Grades (Calificaciones)
-- ============================================
CREATE TABLE grades (
  id VARCHAR(36) PRIMARY KEY,
  student_id VARCHAR(36) NOT NULL,
  course_id VARCHAR(36) NOT NULL,
  teacher_id VARCHAR(36) NOT NULL,
  competency_id VARCHAR(36),
  period ENUM('Q1', 'Q2', 'Q3', 'Q4', 'Final') NOT NULL,
  score DECIMAL(5, 2),
  scale VARCHAR(20),
  remarks TEXT,
  recorded_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (course_id) REFERENCES courses(id),
  FOREIGN KEY (teacher_id) REFERENCES teachers(id),
  FOREIGN KEY (competency_id) REFERENCES competencies(id),
  UNIQUE KEY unique_grade (student_id, course_id, competency_id, period),
  INDEX idx_student (student_id),
  INDEX idx_period (period),
  INDEX idx_recorded_date (recorded_date)
);

-- ============================================
-- TABLA: Attendance (Asistencia)
-- ============================================
CREATE TABLE attendance (
  id VARCHAR(36) PRIMARY KEY,
  student_id VARCHAR(36) NOT NULL,
  course_id VARCHAR(36) NOT NULL,
  date DATE NOT NULL,
  status ENUM('present', 'absent', 'late', 'excused', 'half-day') DEFAULT 'present',
  remarks TEXT,
  recorded_by VARCHAR(36),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_attendance (student_id, course_id, date),
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (course_id) REFERENCES courses(id),
  FOREIGN KEY (recorded_by) REFERENCES users(id),
  INDEX idx_date (date),
  INDEX idx_status (status)
);

-- ============================================
-- TABLA: Schedule (Horarios)
-- ============================================
CREATE TABLE schedule (
  id VARCHAR(36) PRIMARY KEY,
  course_id VARCHAR(36) NOT NULL,
  day_of_week ENUM('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday') NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  room VARCHAR(50),
  building VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
  INDEX idx_day (day_of_week),
  INDEX idx_course (course_id)
);

-- ============================================
-- TABLA: Messages (Mensajes)
-- ============================================
CREATE TABLE messages (
  id VARCHAR(36) PRIMARY KEY,
  sender_id VARCHAR(36) NOT NULL,
  recipient_id VARCHAR(36),
  subject VARCHAR(255),
  body LONGTEXT NOT NULL,
  message_type ENUM('personal', 'group', 'announcement') DEFAULT 'personal',
  sent_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  read_date TIMESTAMP NULL,
  is_read BOOLEAN DEFAULT FALSE,
  parent_message_id VARCHAR(36),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (sender_id) REFERENCES users(id),
  FOREIGN KEY (recipient_id) REFERENCES users(id),
  FOREIGN KEY (parent_message_id) REFERENCES messages(id),
  INDEX idx_recipient (recipient_id),
  INDEX idx_sent_date (sent_date),
  INDEX idx_is_read (is_read)
);

-- ============================================
-- TABLA: Announcements (Anuncios)
-- ============================================
CREATE TABLE announcements (
  id VARCHAR(36) PRIMARY KEY,
  school_id VARCHAR(36) NOT NULL,
  title VARCHAR(255) NOT NULL,
  content LONGTEXT NOT NULL,
  author_id VARCHAR(36) NOT NULL,
  target_roles SET('director', 'subdirector', 'teacher', 'student', 'parent'),
  priority ENUM('low', 'normal', 'high', 'urgent') DEFAULT 'normal',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  published_at TIMESTAMP NULL,
  expires_at TIMESTAMP NULL,
  FOREIGN KEY (school_id) REFERENCES schools(id),
  FOREIGN KEY (author_id) REFERENCES users(id),
  INDEX idx_published (published_at),
  INDEX idx_expires (expires_at)
);

-- ============================================
-- TABLA: Conduct Rules (Normas de Convivencia)
-- ============================================
CREATE TABLE conduct_rules (
  id VARCHAR(36) PRIMARY KEY,
  school_id VARCHAR(36) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category ENUM('positive', 'negative', 'academic', 'behavioral') NOT NULL,
  severity ENUM('low', 'medium', 'high', 'critical'),
  consequences LONGTEXT,
  applicable_grades SET('1', '2', '3', '4', '5', '6'),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (school_id) REFERENCES schools(id),
  INDEX idx_category (category)
);

-- ============================================
-- TABLA: Infractions (Infracciones)
-- ============================================
CREATE TABLE infractions (
  id VARCHAR(36) PRIMARY KEY,
  student_id VARCHAR(36) NOT NULL,
  rule_id VARCHAR(36) NOT NULL,
  date DATE NOT NULL,
  description TEXT,
  reported_by VARCHAR(36),
  status ENUM('reported', 'verified', 'resolved', 'appealed') DEFAULT 'reported',
  consequences TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (rule_id) REFERENCES conduct_rules(id),
  FOREIGN KEY (reported_by) REFERENCES users(id),
  INDEX idx_date (date),
  INDEX idx_status (status)
);

-- ============================================
-- TABLA: Attachments (Archivos Adjuntos)
-- ============================================
CREATE TABLE attachments (
  id VARCHAR(36) PRIMARY KEY,
  entity_type VARCHAR(50),
  entity_id VARCHAR(36),
  filename VARCHAR(255) NOT NULL,
  file_path VARCHAR(500),
  file_size INT,
  mime_type VARCHAR(50),
  uploaded_by VARCHAR(36),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (uploaded_by) REFERENCES users(id),
  INDEX idx_entity (entity_type, entity_id)
);

-- ============================================
-- TABLA: Audit Log (Registro de Auditoría)
-- ============================================
CREATE TABLE audit_logs (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36),
  entity_type VARCHAR(50),
  entity_id VARCHAR(36),
  action VARCHAR(50),
  old_values LONGTEXT,
  new_values LONGTEXT,
  ip_address VARCHAR(45),
  user_agent VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  INDEX idx_user (user_id),
  INDEX idx_entity (entity_type, entity_id),
  INDEX idx_created (created_at)
);

-- ============================================
-- ÍNDICES ADICIONALES
-- ============================================
CREATE INDEX idx_users_school ON users(school_id);
CREATE INDEX idx_students_school ON students(school_id);
CREATE INDEX idx_grades_student ON grades(student_id);
CREATE INDEX idx_grades_course ON grades(course_id);

-- ============================================
-- VISTAS ÚTILES
-- ============================================

-- Vista: Promedio de estudiante por curso
CREATE VIEW v_student_course_average AS
SELECT
  s.id AS student_id,
  s.user_id,
  c.id AS course_id,
  c.name AS course_name,
  AVG(g.score) AS average_score,
  COUNT(g.id) AS grade_count
FROM students s
JOIN enrollments e ON s.id = e.student_id
JOIN courses c ON e.course_id = c.id
LEFT JOIN grades g ON s.id = g.student_id AND c.id = g.course_id
GROUP BY s.id, c.id;

-- Vista: Asistencia por estudiante
CREATE VIEW v_student_attendance_rate AS
SELECT
  s.id AS student_id,
  c.id AS course_id,
  COUNT(*) AS total_days,
  SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) AS days_present,
  ROUND(SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) * 100 / COUNT(*), 2) AS attendance_percentage
FROM students s
JOIN enrollments e ON s.id = e.student_id
JOIN courses c ON e.course_id = c.id
LEFT JOIN attendance a ON s.id = a.student_id AND c.id = a.course_id
GROUP BY s.id, c.id;

-- Vista: Estudiantes activos por grado
CREATE VIEW v_active_students_by_grade AS
SELECT
  grade_level,
  section,
  COUNT(*) AS total_students
FROM students
WHERE status = 'active'
GROUP BY grade_level, section;

-- ============================================
-- DATOS INICIALES
-- ============================================

-- Insertar escuela
INSERT INTO schools (id, name, code, address, phone, email, established_year, principal_name) VALUES
('school-001', 'IE Manuel Fidencio Hidalgo Flores', 'MFHF-2024', 'Calle Principal 123, Lima', '555-1234', 'info@mfhf.edu.pe', 1985, 'Dr. Fernando López');

-- (Las demás inserciones de usuarios se realizarán a través de la aplicación)

-- ============================================
-- FIN DEL SCHEMA
-- ============================================
