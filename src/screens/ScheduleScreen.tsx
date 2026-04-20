import { motion } from 'motion/react';
import { Calendar, Clock, MapPin, User, AlertCircle, BookOpen, Zap } from 'lucide-react';
import { User as UserType } from '../types';

interface ScheduleScreenProps {
  user: UserType;
}

interface ClassSession {
  id: string;
  course: string;
  instructor: string;
  room: string;
  day: string;
  startTime: string;
  endTime: string;
  section: string;
}

const scheduleData: ClassSession[] = [
  { id: '1', course: 'Matemáticas', instructor: 'Prof. García', room: 'A-101', day: 'Lunes', startTime: '08:00', endTime: '09:00', section: '3°A' },
  { id: '2', course: 'Lenguaje', instructor: 'Prof. López', room: 'A-102', day: 'Lunes', startTime: '09:00', endTime: '10:00', section: '3°A' },
  { id: '3', course: 'Ciencias', instructor: 'Prof. Rodríguez', room: 'Lab-01', day: 'Lunes', startTime: '10:30', endTime: '11:30', section: '3°A' },
  { id: '4', course: 'Historia', instructor: 'Prof. Martínez', room: 'A-103', day: 'Martes', startTime: '08:00', endTime: '09:00', section: '3°A' },
  { id: '5', course: 'Inglés', instructor: 'Prof. Silva', room: 'A-104', day: 'Martes', startTime: '09:00', endTime: '10:00', section: '3°A' },
  { id: '6', course: 'Matemáticas', instructor: 'Prof. García', room: 'A-101', day: 'Martes', startTime: '10:30', endTime: '11:30', section: '3°A' },
  { id: '7', course: 'Física', instructor: 'Prof. Sánchez', room: 'Lab-02', day: 'Miércoles', startTime: '08:00', endTime: '09:00', section: '3°A' },
  { id: '8', course: 'Lenguaje', instructor: 'Prof. López', room: 'A-102', day: 'Miércoles', startTime: '09:00', endTime: '10:00', section: '3°A' },
  { id: '9', course: 'Educación Física', instructor: 'Prof. Torres', room: 'Patio', day: 'Miércoles', startTime: '10:30', endTime: '11:30', section: '3°A' },
  { id: '10', course: 'Matemáticas', instructor: 'Prof. García', room: 'A-101', day: 'Jueves', startTime: '08:00', endTime: '09:00', section: '3°A' },
];

const days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
const timeSlots = ['08:00', '09:00', '10:30', '11:30', '13:00', '14:00'];

const getCourseColor = (course: string): string => {
  const colors: Record<string, string> = {
    'Matemáticas': 'border-neon-cyan',
    'Lenguaje': 'border-neon-magenta',
    'Ciencias': 'border-neon-lime',
    'Historia': 'border-neon-blue',
    'Inglés': 'border-neon-cyan',
    'Física': 'border-neon-magenta',
    'Educación Física': 'border-neon-lime',
  };
  return colors[course] || 'border-neon-cyan';
};

const getCourseGlow = (course: string): string => {
  const glows: Record<string, string> = {
    'Matemáticas': 'bg-neon-cyan/10',
    'Lenguaje': 'bg-neon-magenta/10',
    'Ciencias': 'bg-neon-lime/10',
    'Historia': 'bg-neon-blue/10',
    'Inglés': 'bg-neon-cyan/10',
    'Física': 'bg-neon-magenta/10',
    'Educación Física': 'bg-neon-lime/10',
  };
  return glows[course] || 'bg-neon-cyan/10';
};

export default function ScheduleScreen({ user }: ScheduleScreenProps) {
  const userSchedule = scheduleData.filter(session => {
    if (user.role === 'teacher') return true;
    if (user.role === 'student') return true;
    return false;
  });

  return (
    <div className="min-h-screen p-6 space-y-8 pb-24">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-neon-cyan/20 rounded-lg neon-border-cyan">
            <Calendar className="w-8 h-8 text-neon-cyan" />
          </div>
          <div>
            <h1 className="text-4xl font-bold tracking-tighter uppercase">
              Mi <span className="text-neon-magenta neon-text-magenta">Horario</span>
            </h1>
            <p className="text-xs text-white/75 font-mono tracking-widest">CLASES Y AULAS</p>
          </div>
        </div>
      </motion.div>

      {/* Schedule Grid View */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card p-6 neon-border-cyan"
      >
        <h3 className="text-white font-bold uppercase tracking-wider mb-6 flex items-center gap-2">
          <Clock className="w-5 h-5 text-neon-cyan" />
          Horario Semanal
        </h3>
        <div className="overflow-x-auto">
          <div className="min-w-max">
            {/* Days Header */}
            <div className="grid gap-4" style={{ gridTemplateColumns: 'minmax(120px, 1fr) repeat(5, minmax(160px, 1fr))' }}>
              <div></div>
              {days.map((day) => (
                <div key={day} className="text-center">
                  <p className="text-neon-cyan font-bold uppercase text-sm tracking-wider">{day}</p>
                </div>
              ))}
            </div>

            {/* Time Slots */}
            <div className="mt-4 space-y-4">
              {timeSlots.map((time) => (
                <div key={time} className="grid gap-4" style={{ gridTemplateColumns: 'minmax(120px, 1fr) repeat(5, minmax(160px, 1fr))' }}>
                  <div className="text-white/85 text-sm font-mono text-center pt-2">{time}</div>
                  {days.map((day) => {
                    const session = userSchedule.find(s => s.day === day && s.startTime === time);
                    return (
                      <motion.div
                        key={`${day}-${time}`}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className={`min-h-24 rounded-lg border-2 p-3 transition-all ${
                          session
                            ? `${getCourseColor(session.course)} ${getCourseGlow(session.course)}`
                            : 'border-white/10 bg-white/5'
                        }`}
                      >
                        {session && (
                          <div className="space-y-1">
                            <p className="text-white font-bold text-sm uppercase tracking-wider">{session.course}</p>
                            <div className="flex items-center gap-1 text-xs text-white/90">
                              <User className="w-3 h-3" />
                              <span>{session.instructor}</span>
                            </div>
                            <div className="flex items-center gap-1 text-xs text-white/90">
                              <MapPin className="w-3 h-3" />
                              <span>{session.room}</span>
                            </div>
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* List View */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-card p-6 neon-border-magenta"
      >
        <h3 className="text-white font-bold uppercase tracking-wider mb-6 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-neon-magenta" />
          Clases del Día
        </h3>
        <div className="space-y-3">
          {userSchedule.slice(0, 6).map((session, i) => (
            <motion.div
              key={session.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`border-l-4 ${getCourseColor(session.course)} ${getCourseGlow(session.course)} p-4 rounded-lg hover:bg-white/10 transition-all cursor-pointer`}
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="text-white font-bold uppercase tracking-wide">{session.course}</p>
                  <p className="text-xs text-white/85 mt-1">{session.section}</p>
                </div>
                <div className="text-right">
                  <p className="text-neon-cyan font-bold text-sm">{session.startTime} - {session.endTime}</p>
                  <p className="text-xs text-white/75">{session.day}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-xs text-white/90">
                <div className="flex items-center gap-1">
                  <User className="w-4 h-4" />
                  {session.instructor}
                </div>
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {session.room}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Quick Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        <div className="glass-card p-4 neon-border-lime">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-5 h-5 text-neon-lime" />
            <p className="text-white/85 text-sm uppercase">Total de Clases</p>
          </div>
          <p className="text-3xl font-bold text-white">{userSchedule.length}</p>
        </div>
        <div className="glass-card p-4 neon-border-cyan">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-5 h-5 text-neon-cyan" />
            <p className="text-white/85 text-sm uppercase">Horas Semanales</p>
          </div>
          <p className="text-3xl font-bold text-white">{userSchedule.length}</p>
        </div>
        <div className="glass-card p-4 neon-border-magenta">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-5 h-5 text-neon-magenta" />
            <p className="text-white/85 text-sm uppercase">Próxima Clase</p>
          </div>
          <p className="text-white font-semibold">{userSchedule[0]?.course || 'N/A'}</p>
        </div>
      </motion.div>
    </div>
  );
}
