import { motion } from 'motion/react';
import { useState } from 'react';
import { Heart, MessageCircle, Share2, Users, Calendar, MapPin, Image, Newspaper, Zap } from 'lucide-react';
import HeaderElegante from '../components/HeaderElegante';
import ElegantCard from '../components/ElegantCard';

interface CommunityItem {
  id: string;
  type: 'event' | 'news' | 'gallery' | 'announcement';
  title: string;
  description: string;
  author: string;
  date: string;
  image?: string;
  likes: number;
  comments: number;
  attendees?: number;
  location?: string;
}

export default function CommunityScreenModern() {
  const [selectedView, setSelectedView] = useState<'all' | 'events' | 'news' | 'gallery'>('all');
  const [liked, setLiked] = useState<Set<string>>(new Set());

  const toggleLike = (id: string) => {
    const newLiked = new Set(liked);
    if (newLiked.has(id)) {
      newLiked.delete(id);
    } else {
      newLiked.add(id);
    }
    setLiked(newLiked);
  };

  const items: CommunityItem[] = [
    {
      id: '1',
      type: 'event',
      title: 'Día del Logro Académico 2024',
      description: 'Gran celebración de los logros de nuestros estudiantes. Habrá presentaciones, reconocimientos y convivencia familiar.',
      author: 'Dr. Fernando López',
      date: '2024-05-10',
      location: 'Auditorio Principal',
      attendees: 450,
      likes: 89,
      comments: 24
    },
    {
      id: '2',
      type: 'news',
      title: 'Resultados de la Olimpiada de Matemáticas',
      description: 'Felicidades a nuestros estudiantes que obtuvieron medallas en la competencia regional. Resultados que nos enorgullecen como institución.',
      author: 'Mg. María García',
      date: '2024-04-18',
      likes: 156,
      comments: 42
    },
    {
      id: '3',
      type: 'gallery',
      title: 'Excursión Educativa al Museo de Historia Natural',
      description: 'Galería de fotos de nuestro viaje educativo. Una experiencia enriquecedora para los estudiantes de 5to de secundaria.',
      author: 'Lic. Patricia López',
      date: '2024-04-15',
      image: '🖼️',
      likes: 234,
      comments: 67
    },
    {
      id: '4',
      type: 'announcement',
      title: 'Actualizaciones en el Horario Académico',
      description: 'Por favor, revisar el nuevo horario que entra en vigencia a partir del próximo lunes. Cambios importantes en horas de clase.',
      author: 'Dirección',
      date: '2024-04-20',
      likes: 45,
      comments: 18
    },
    {
      id: '5',
      type: 'event',
      title: 'Campeonato Deportivo Interescolar',
      description: 'Participa en nuestro evento deportivo anual. Abierto para todos los estudiantes. Registro hasta el 30 de abril.',
      author: 'Prof. Carlos Rodríguez',
      date: '2024-04-22',
      location: 'Complejo Deportivo',
      attendees: 200,
      likes: 123,
      comments: 35
    },
    {
      id: '6',
      type: 'news',
      title: 'Nuevo Programa de Becas Disponible',
      description: 'Anunciamos la apertura del programa de becas para estudiantes con excelente desempeño académico. Consulta los requisitos en la oficina de admisión.',
      author: 'Subdirección',
      date: '2024-04-19',
      likes: 198,
      comments: 56
    }
  ];

  const typeConfig = {
    event: { icon: Calendar, color: 'blue', label: 'Evento' },
    news: { icon: Newspaper, color: 'indigo', label: 'Noticia' },
    gallery: { icon: Image, color: 'purple', label: 'Galería' },
    announcement: { icon: Zap, color: 'pink', label: 'Anuncio' }
  };

  const filteredItems = items.filter(item =>
    selectedView === 'all' ? true : item.type === selectedView
  );

  return (
    <div className="min-h-screen bg-slate-900/50 overflow-hidden">
      {/* Background decorativo */}
      <div className="fixed inset-0 -z-50">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/5 via-transparent to-purple-600/5" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <HeaderElegante
          icon={Users}
          title="EDUGEST COMUNIDAD"
          subtitle="Eventos, noticias, galerías y anuncios de la institución"
        />

        {/* Navigation tabs */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex gap-3 mb-8 border-b border-slate-700/30 pb-4 overflow-x-auto"
        >
          {[
            { id: 'all', label: 'Todos', icon: Users },
            { id: 'events', label: 'Eventos', icon: Calendar },
            { id: 'news', label: 'Noticias', icon: Newspaper },
            { id: 'gallery', label: 'Galería', icon: Image }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedView(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all whitespace-nowrap ${
                selectedView === tab.id
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white'
                  : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </motion.div>

        {/* Posts Feed */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-6"
        >
          {filteredItems.map((item, i) => {
            const config = typeConfig[item.type];
            const TypeIcon = config.icon;
            const isLiked = liked.has(item.id);

            return (
              <ElegantCard key={item.id} index={i} variant="elevated">
                <div className="space-y-4">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div className={`p-3 rounded-lg bg-${config.color}-500/20 text-${config.color}-400`}>
                        <TypeIcon className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-bold text-slate-100 text-lg">{item.title}</h4>
                          <span className={`text-xs font-semibold px-2 py-1 rounded bg-${config.color}-500/20 text-${config.color}-300`}>
                            {config.label}
                          </span>
                        </div>
                        <p className="text-sm text-slate-400">{item.author} • {item.date}</p>
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-slate-300 leading-relaxed">{item.description}</p>

                  {/* Meta info */}
                  {(item.location || item.attendees) && (
                    <div className="flex flex-wrap gap-4 text-sm text-slate-400 pt-3 border-t border-slate-700/30">
                      {item.location && (
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          {item.location}
                        </div>
                      )}
                      {item.attendees && (
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          {item.attendees} asistentes esperados
                        </div>
                      )}
                    </div>
                  )}

                  {/* Image placeholder */}
                  {item.image && (
                    <div className="w-full h-48 rounded-lg bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-slate-700/30 flex items-center justify-center mt-4">
                      <span className="text-4xl">{item.image}</span>
                    </div>
                  )}

                  {/* Engagement footer */}
                  <div className="flex items-center justify-between pt-4 border-t border-slate-700/30 text-slate-400">
                    <div className="flex gap-4">
                      <button
                        onClick={() => toggleLike(item.id)}
                        className={`flex items-center gap-2 transition-colors ${
                          isLiked ? 'text-red-400' : 'hover:text-red-400'
                        }`}
                      >
                        <Heart
                          className="w-5 h-5"
                          fill={isLiked ? 'currentColor' : 'none'}
                        />
                        <span className="text-sm font-medium">
                          {item.likes + (isLiked ? 1 : 0)}
                        </span>
                      </button>
                      <button className="flex items-center gap-2 hover:text-blue-400 transition-colors">
                        <MessageCircle className="w-5 h-5" />
                        <span className="text-sm font-medium">{item.comments}</span>
                      </button>
                      <button className="flex items-center gap-2 hover:text-purple-400 transition-colors">
                        <Share2 className="w-5 h-5" />
                        <span className="text-sm font-medium">Compartir</span>
                      </button>
                    </div>
                  </div>
                </div>
              </ElegantCard>
            );
          })}
        </motion.div>

        {/* Crear nuevo post */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-8 p-6 rounded-xl glass-card-elevated"
        >
          <h3 className="text-lg font-bold text-slate-100 mb-4">Compartir con la Comunidad</h3>
          <textarea
            placeholder="¿Qué deseas compartir con la comunidad educativa?"
            className="w-full px-4 py-3 bg-slate-800/50 text-slate-100 rounded-lg border border-slate-600/30 focus:outline-none focus:border-indigo-500/50 resize-none placeholder-slate-500"
            rows={4}
          />
          <div className="mt-4 flex gap-3 justify-end">
            <button className="px-6 py-2 text-slate-400 hover:text-slate-300 transition-colors">
              Cancelar
            </button>
            <button className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-lg font-semibold transition-colors">
              Publicar
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
