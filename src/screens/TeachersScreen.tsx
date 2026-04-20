import { motion } from 'motion/react';
import { Users, Mail, Phone, Briefcase, Award, Calendar } from 'lucide-react';
import { User } from '../types';

interface TeachersScreenProps {
  user: User;
}

interface Teacher {
  id: string;
  name: string;
  specialization: string;
  courses: string[];
  email: string;
  phone: string;
  experience: string;
  status: string;
}

const teachers: Teacher[] = [
  {
    id: '1',
    name: 'Prof. García',
    specialization: 'Matemáticas',
    courses: ['Álgebra', 'Geometría', 'Cálculo'],
    email: 'garcia@escuela.edu',
    phone: '555-0101',
    experience: '15 años',
    status: 'Activo',
  },
  {
    id: '2',
    name: 'Prof. López',
    specialization: 'Lenguaje',
    courses: ['Literatura', 'Comprensión Lectora'],
    email: 'lopez@escuela.edu',
    phone: '555-0102',
    experience: '12 años',
    status: 'Activo',
  },
  {
    id: '3',
    name: 'Prof. Rodríguez',
    specialization: 'Ciencias',
    courses: ['Física', 'Química', 'Biología'],
    email: 'rodriguez@escuela.edu',
    phone: '555-0103',
    experience: '18 años',
    status: 'Activo',
  },
];

export default function TeachersScreen({ user }: TeachersScreenProps) {
  return (
    <div className="min-h-screen p-6 space-y-8 pb-24">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-neon-cyan/20 rounded-lg neon-border-cyan">
            <Briefcase className="w-8 h-8 text-neon-cyan" />
          </div>
          <div>
            <h1 className="text-4xl font-bold tracking-tighter uppercase">
              <span className="text-neon-cyan neon-text-cyan">Docentes</span>
            </h1>
            <p className="text-xs text-white/75 font-mono tracking-widest">PERSONAL DOCENTE</p>
          </div>
        </div>
      </motion.div>

      {/* Teachers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {teachers.map((teacher, i) => (
          <motion.div
            key={teacher.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="glass-card p-6 neon-border-magenta hover:neon-border-cyan transition-all"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-white font-bold text-lg">{teacher.name}</h3>
                <p className="text-neon-cyan text-sm font-semibold mt-1">{teacher.specialization}</p>
              </div>
              <div className="px-3 py-1 bg-neon-lime/20 text-neon-lime text-xs rounded-full font-semibold">
                {teacher.status}
              </div>
            </div>

            <div className="space-y-3 mb-4 pb-4 border-b border-white/10">
              <div>
                <p className="text-white/85 text-xs uppercase tracking-wider mb-1">Cursos a Cargo</p>
                <div className="flex flex-wrap gap-1">
                  {teacher.courses.map((course) => (
                    <span key={course} className="text-xs bg-neon-magenta/20 text-neon-magenta px-2 py-1 rounded">
                      {course}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-white/90">
                <Mail className="w-4 h-4" />
                <span className="text-xs">{teacher.email}</span>
              </div>
              <div className="flex items-center gap-2 text-white/90">
                <Phone className="w-4 h-4" />
                <span className="text-xs">{teacher.phone}</span>
              </div>
              <div className="flex items-center gap-2 text-white/90">
                <Award className="w-4 h-4" />
                <span className="text-xs">{teacher.experience}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
