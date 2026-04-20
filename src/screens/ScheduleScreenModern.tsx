import { motion } from 'motion/react';
import { Calendar, Clock, MapPin, User, AlertCircle, BookOpen, Zap } from 'lucide-react';
import FuturisticCard from '../components/FuturisticCard';
import HologramText from '../components/HologramText';

export default function ScheduleScreenModern() {
  const scheduleData = [
    { id: '1', course: 'Matemáticas', instructor: 'Prof. García', room: 'A-101', day: 'Lunes', startTime: '08:00', endTime: '09:00' },
    { id: '2', course: 'Lenguaje', instructor: 'Prof. López', room: 'A-102', day: 'Lunes', startTime: '09:00', endTime: '10:00' },
    { id: '3', course: 'Ciencias', instructor: 'Prof. Rodríguez', room: 'Lab-01', day: 'Lunes', startTime: '10:30', endTime: '11:30' },
    { id: '4', course: 'Historia', instructor: 'Prof. Martínez', room: 'A-103', day: 'Martes', startTime: '08:00', endTime: '09:00' },
    { id: '5', course: 'Inglés', instructor: 'Prof. Silva', room: 'A-104', day: 'Martes', startTime: '09:00', endTime: '10:00' },
  ];

  const days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
  const timeSlots = ['08:00', '09:00', '10:30', '11:30', '13:00', '14:00'];

  return (
    <div className="min-h-screen bg-dark-bg text-white overflow-hidden p-6">
      {/* Fondo animado */}
      <div className="fixed inset-0 -z-50">
        <div className="absolute inset-0 bg-gradient-cyber opacity-60"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3"
        >
          <h1 className="text-5xl font-black tracking-tighter">
            Mi <HologramText>Horario</HologramText>
          </h1>
          <p className="text-white/85 font-mono tracking-widest text-sm">CLASES Y AULAS</p>
        </motion.div>

        {/* Weekly Schedule Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <FuturisticCard variant="cyan" glow>
            <div className="p-6">
              <h3 className="text-white font-bold uppercase tracking-wider mb-6 flex items-center gap-2">
                <Clock className="w-5 h-5 text-neon-cyan" />
                <HologramText variant="secondary">Horario Semanal</HologramText>
              </h3>

              <div className="overflow-x-auto">
                <div className="min-w-max">
                  {/* Days Header */}
                  <div className="grid gap-4 mb-4" style={{ gridTemplateColumns: 'minmax(120px, 1fr) repeat(5, minmax(160px, 1fr))' }}>
                    <div></div>
                    {days.map((day) => (
                      <motion.div
                        key={day}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center"
                      >
                        <p className="text-neon-cyan font-bold uppercase text-sm tracking-wider">{day}</p>
                      </motion.div>
                    ))}
                  </div>

                  {/* Time Slots */}
                  <div className="space-y-3">
                    {timeSlots.map((time, timeIdx) => (
                      <div key={time} className="grid gap-4" style={{ gridTemplateColumns: 'minmax(120px, 1fr) repeat(5, minmax(160px, 1fr))' }}>
                        <div className="text-white/85 text-sm font-mono text-center pt-2">{time}</div>
                        {days.map((day) => {
                          const session = scheduleData.find(s => s.day === day && s.startTime === time);
                          const colorMap: Record<string, string> = {
                            'Matemáticas': 'neon-cyan',
                            'Lenguaje': 'neon-magenta',
                            'Ciencias': 'neon-lime',
                            'Historia': 'neon-blue',
                          };
                          const borderColor = session ? `border-${colorMap[session.course] || 'neon-cyan'}` : '';

                          return (
                            <motion.div
                              key={`${day}-${time}`}
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className={`min-h-24 rounded-lg border-2 p-3 transition-all ${
                                session
                                  ? `${borderColor} bg-gradient-to-br from-white/10 to-white/5 hover:from-white/20 hover:to-white/10 hover:shadow-glow-cyan`
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
            </div>
          </FuturisticCard>
        </motion.div>

        {/* Daily Classes */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="mb-4">
            <h3 className="text-2xl font-bold uppercase tracking-wider">
              <HologramText>Próximas Clases</HologramText>
            </h3>
          </div>

          <div className="space-y-3">
            {scheduleData.slice(0, 5).map((session, i) => (
              <motion.div
                key={session.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.1 }}
              >
                <FuturisticCard variant={i % 2 === 0 ? 'cyan' : 'magenta'} glow hover>
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <p className="text-white font-bold uppercase tracking-wide text-lg">{session.course}</p>
                        <p className="text-sm text-white/85 mt-1">{session.day} - {session.startTime} a {session.endTime}</p>
                      </div>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                        className="w-8 h-8 rounded-full border-2 border-neon-cyan border-t-transparent"
                      ></motion.div>
                    </div>
                    <div className="flex items-center gap-6 text-sm text-white/90">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        {session.instructor}
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        {session.room}
                      </div>
                    </div>
                  </div>
                </FuturisticCard>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Quick Info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          {[
            { icon: Zap, label: 'Total de Clases', value: scheduleData.length, color: 'lime' },
            { icon: Clock, label: 'Horas Semanales', value: '20', color: 'cyan' },
            { icon: AlertCircle, label: 'Próxima Clase', value: 'Matemáticas', color: 'magenta' },
          ].map((stat, i) => (
            <FuturisticCard key={i} variant={stat.color as any} glow hover>
              <div className="p-6 space-y-3">
                <stat.icon className="w-6 h-6 text-neon-cyan animate-pulse-glow" />
                <p className="text-xs uppercase tracking-widest text-white/85">{stat.label}</p>
                <p className="text-2xl font-bold text-white">{stat.value}</p>
              </div>
            </FuturisticCard>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
