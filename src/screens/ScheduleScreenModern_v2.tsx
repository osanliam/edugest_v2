import { motion } from 'motion/react';
import { useState } from 'react';
import { Clock, Users, MapPin, BookOpen, Calendar } from 'lucide-react';
import HeaderElegante from '../components/HeaderElegante';
import ElegantCard from '../components/ElegantCard';

interface ClassSession {
  id: string;
  course: string;
  section: string;
  day: string;
  startTime: string;
  endTime: string;
  room: string;
  students: number;
  capacity: number;
  competencies: string[];
}

export default function ScheduleScreenModernV2() {
  const [selectedDay, setSelectedDay] = useState('lunes');

  const days = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes'];

  // Horario del docente - Secciones que enseña
  const allClasses: ClassSession[] = [
    // Lunes
    {
      id: '1',
      course: 'Comunicación I',
      section: '3ro A',
      day: 'lunes',
      startTime: '08:00',
      endTime: '09:30',
      room: 'Aula 301',
      students: 32,
      capacity: 35,
      competencies: ['Lee críticamente', 'Se expresa oralmente']
    },
    {
      id: '2',
      course: 'Comunicación I',
      section: '3ro B',
      day: 'lunes',
      startTime: '09:45',
      endTime: '11:15',
      room: 'Aula 302',
      students: 31,
      capacity: 35,
      competencies: ['Lee críticamente', 'Se expresa oralmente']
    },
    {
      id: '3',
      course: 'Literatura Peruana',
      section: '5to A',
      day: 'lunes',
      startTime: '14:00',
      endTime: '15:30',
      room: 'Aula 501',
      students: 28,
      capacity: 30,
      competencies: ['Interpreta textos', 'Analiza géneros literarios']
    },
    // Martes
    {
      id: '4',
      course: 'Comunicación I',
      section: '2do A',
      day: 'martes',
      startTime: '08:00',
      endTime: '09:30',
      room: 'Aula 201',
      students: 33,
      capacity: 35,
      competencies: ['Lee críticamente', 'Se expresa oralmente']
    },
    {
      id: '5',
      course: 'Comunicación I',
      section: '2do B',
      day: 'martes',
      startTime: '09:45',
      endTime: '11:15',
      room: 'Aula 202',
      students: 32,
      capacity: 35,
      competencies: ['Lee críticamente', 'Se expresa oralmente']
    },
    {
      id: '6',
      course: 'Taller de Redacción',
      section: '4to A',
      day: 'martes',
      startTime: '15:00',
      endTime: '16:30',
      room: 'Aula 401',
      students: 25,
      capacity: 30,
      competencies: ['Escribe diversos tipos de textos']
    },
    // Miércoles
    {
      id: '7',
      course: 'Comunicación I',
      section: '1ro A',
      day: 'miércoles',
      startTime: '10:00',
      endTime: '11:30',
      room: 'Aula 101',
      students: 34,
      capacity: 35,
      competencies: ['Lee críticamente', 'Se expresa oralmente']
    },
    {
      id: '8',
      course: 'Comunicación I',
      section: '1ro B',
      day: 'miércoles',
      startTime: '11:45',
      endTime: '13:15',
      room: 'Aula 102',
      students: 32,
      capacity: 35,
      competencies: ['Lee críticamente', 'Se expresa oralmente']
    },
    {
      id: '9',
      course: 'Literatura Peruana',
      section: '5to B',
      day: 'miércoles',
      startTime: '14:00',
      endTime: '15:30',
      room: 'Aula 502',
      students: 29,
      capacity: 30,
      competencies: ['Interpreta textos', 'Analiza géneros literarios']
    },
    // Jueves
    {
      id: '10',
      course: 'Taller de Redacción',
      section: '4to B',
      day: 'jueves',
      startTime: '08:00',
      endTime: '09:30',
      room: 'Aula 402',
      students: 26,
      capacity: 30,
      competencies: ['Escribe diversos tipos de textos']
    },
    {
      id: '11',
      course: 'Comunicación I',
      section: '3ro C',
      day: 'jueves',
      startTime: '14:00',
      endTime: '15:30',
      room: 'Aula 303',
      students: 30,
      capacity: 35,
      competencies: ['Lee críticamente', 'Se expresa oralmente']
    },
    // Viernes
    {
      id: '12',
      course: 'Seminario de Oratoria',
      section: 'Todos',
      day: 'viernes',
      startTime: '08:00',
      endTime: '09:30',
      room: 'Auditorio',
      students: 150,
      capacity: 200,
      competencies: ['Se expresa oralmente', 'Participa en debates']
    },
    {
      id: '13',
      course: 'Asesoría Académica',
      section: 'Libre',
      day: 'viernes',
      startTime: '15:00',
      endTime: '17:00',
      room: 'Sala de Docentes',
      students: 0,
      capacity: 10,
      competencies: ['Tutoría personalizada']
    }
  ];

  const dayClasses = allClasses.filter(c => c.day === selectedDay);

  // Estadísticas
  const totalClasses = allClasses.length;
  const totalStudents = allClasses.reduce((sum, c) => sum + c.students, 0);
  const uniqueSections = new Set(allClasses.map(c => c.section.split(' ')[0])).size;
  const avgCapacity = Math.round(
    allClasses.reduce((sum, c) => sum + (c.students / c.capacity * 100), 0) / allClasses.length
  );

  return (
    <div className="min-h-screen bg-slate-900/50 overflow-hidden">
      {/* Background decorativo */}
      <div className="fixed inset-0 -z-50">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/5 via-transparent to-purple-600/5" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <HeaderElegante
          icon={Calendar}
          title="EDUGEST HORARIO ACADÉMICO"
          subtitle="Secciones que imparto y calendario de clases"
        />

        {/* Stats Overview */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
        >
          {[
            { label: 'Total de Clases', value: totalClasses, color: 'indigo' },
            { label: 'Estudiantes', value: totalStudents, color: 'blue' },
            { label: 'Grados que enseño', value: `${uniqueSections} grados`, color: 'green' },
            { label: 'Ocupación Promedio', value: `${avgCapacity}%`, color: 'purple' }
          ].map((stat, i) => (
            <ElegantCard key={i} index={i} variant="minimal">
              <div>
                <p className="text-sm font-medium text-slate-400">{stat.label}</p>
                <p className={`text-2xl font-bold mt-2 text-${stat.color}-300`}>{stat.value}</p>
              </div>
            </ElegantCard>
          ))}
        </motion.div>

        {/* Day selector */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 p-6 rounded-xl glass-card"
        >
          <p className="text-sm text-slate-400 mb-4 font-semibold">Selecciona un día</p>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {days.map(day => (
              <button
                key={day}
                onClick={() => setSelectedDay(day)}
                className={`px-4 py-2 rounded-lg transition-all capitalize whitespace-nowrap font-medium ${
                  selectedDay === day
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white'
                    : 'bg-slate-700/50 text-slate-300 hover:bg-slate-600/50'
                }`}
              >
                {day}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Classes for selected day */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="space-y-4 mb-8"
        >
          <h3 className="text-xl font-bold text-slate-100 capitalize">
            Clases del {selectedDay} ({dayClasses.length})
          </h3>

          {dayClasses.length > 0 ? (
            dayClasses.map((cls, i) => {
              const occupancy = Math.round((cls.students / cls.capacity) * 100);

              return (
                <ElegantCard key={cls.id} index={i}>
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="text-lg font-bold text-slate-100">{cls.course}</h4>
                        <p className="text-sm text-indigo-400 font-semibold">{cls.section}</p>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30`}>
                        {cls.startTime} - {cls.endTime}
                      </div>
                    </div>

                    {/* Details grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="flex items-center gap-3">
                        <MapPin className="w-5 h-5 text-slate-400" />
                        <div>
                          <p className="text-xs text-slate-400 uppercase">Sala</p>
                          <p className="text-slate-100 font-semibold">{cls.room}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Users className="w-5 h-5 text-slate-400" />
                        <div>
                          <p className="text-xs text-slate-400 uppercase">Estudiantes</p>
                          <p className="text-slate-100 font-semibold">{cls.students}/{cls.capacity}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Clock className="w-5 h-5 text-slate-400" />
                        <div>
                          <p className="text-xs text-slate-400 uppercase">Ocupación</p>
                          <div className="flex items-center gap-2">
                            <div className="w-24 h-2 bg-slate-700/50 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${
                                  occupancy > 80
                                    ? 'bg-red-500'
                                    : occupancy > 60
                                    ? 'bg-yellow-500'
                                    : 'bg-green-500'
                                }`}
                                style={{ width: `${occupancy}%` }}
                              />
                            </div>
                            <span className="text-sm text-slate-300 font-semibold">{occupancy}%</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Competencies */}
                    <div className="pt-4 border-t border-slate-700/30">
                      <p className="text-xs text-slate-400 uppercase mb-2">Competencias a desarrollar</p>
                      <div className="flex flex-wrap gap-2">
                        {cls.competencies.map((comp, i) => (
                          <span
                            key={i}
                            className="px-3 py-1 text-xs rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30"
                          >
                            {comp}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </ElegantCard>
              );
            })
          ) : (
            <div className="text-center py-12 text-slate-400">
              <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No hay clases asignadas para este día</p>
            </div>
          )}
        </motion.div>

        {/* Resumen semanal */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="p-6 rounded-xl glass-card"
        >
          <h3 className="text-lg font-bold text-slate-100 mb-4">Distribución por Cursos</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { course: 'Comunicación I', sections: 6, students: 192 },
              { course: 'Literatura Peruana', sections: 2, students: 57 },
              { course: 'Taller de Redacción', sections: 2, students: 51 },
              { course: 'Seminario de Oratoria', sections: 1, students: 150 }
            ].map((item, i) => (
              <ElegantCard key={i} index={i} variant="minimal">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-slate-100">{item.course}</h4>
                    <p className="text-sm text-slate-400 mt-1">{item.sections} sección(es) • {item.students} estudiantes</p>
                  </div>
                  <BookOpen className="w-6 h-6 text-indigo-400 opacity-50" />
                </div>
              </ElegantCard>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
