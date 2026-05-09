import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  BookOpen, Video, FileText, Link2, Upload, Download, Plus, X, Search,
  Clock, Users, CheckCircle2, AlertCircle, ChevronRight, ChevronDown,
  Send, Trash2, Eye, MessageSquare, Calendar, GraduationCap,
  File, ExternalLink, Star, MoreVertical,
  ArrowLeft, Inbox, ClipboardList, FolderOpen
} from 'lucide-react';
import HeaderElegante from '../components/HeaderElegante';
import ElegantCard from '../components/ElegantCard';
import { User } from '../types';
import {
  getAulas, getMateriales, getEntregas, getComentarios,
  guardarAulas, guardarMateriales, guardarEntregas, guardarComentarios,
  guardarArchivoAula, obtenerArchivoAula,
  guardarEntregaArchivo,
} from '../services/dataService';
import {
  crearAula, crearMaterial, crearEntrega,
  actualizarEntrega,
  eliminarAula, eliminarMaterial,
  getAulas as getAulasCloud, getMaterialesAula,
} from '../utils/apiClient';

type TipoMaterial = 'video' | 'documento' | 'enlace' | 'tarea' | 'archivo';
type EstadoEntrega = 'pendiente' | 'entregado' | 'calificado' | 'tarde';
type VistaAula = 'clases' | 'detalle' | 'tareas' | 'recursos' | 'crear-aula' | 'crear-material';

interface AulaLocal {
  id: string;
  nombre: string;
  descripcion: string;
  docenteId: string;
  grado: string;
  seccion: string;
  curso: string;
  imagen: string;
  estado: string;
  creado: string;
  actualizado: string;
}

interface MaterialLocal {
  id: string;
  aulaId: string;
  tipo: TipoMaterial;
  titulo: string;
  descripcion: string;
  contenido: string;
  url: string;
  nombreArchivo: string;
  tipoArchivo: string;
  pesoArchivo: number;
  fechaEntrega: string;
  creadoPor: string;
  creado: string;
  actualizado: string;
}

interface EntregaLocal {
  id: string;
  materialId: string;
  alumnoId: string;
  aulaId: string;
  contenido: string;
  nombreArchivo: string;
  tipoArchivo: string;
  pesoArchivo: number;
  nota: number | null;
  comentarioDoc: string;
  estado: EstadoEntrega;
  creado: string;
  actualizado: string;
}

interface ComentarioLocal {
  id: string;
  materialId: string;
  aulaId: string;
  userId: string;
  userName: string;
  contenido: string;
  creado: string;
}

const TIPO_CONFIG: Record<TipoMaterial, { icon: React.ReactNode; color: string; bg: string; label: string }> = {
  video:     { icon: <Video className="w-5 h-5" />,     color: 'text-red-400',   bg: 'bg-red-500/10',   label: 'Video' },
  documento: { icon: <FileText className="w-5 h-5" />,   color: 'text-blue-400',  bg: 'bg-blue-500/10',  label: 'Documento' },
  enlace:    { icon: <Link2 className="w-5 h-5" />,      color: 'text-green-400', bg: 'bg-green-500/10', label: 'Enlace' },
  tarea:     { icon: <ClipboardList className="w-5 h-5" />, color: 'text-amber-400', bg: 'bg-amber-500/10', label: 'Tarea' },
  archivo:   { icon: <File className="w-5 h-5" />,        color: 'text-purple-400', bg: 'bg-purple-500/10', label: 'Archivo' },
};

const GRADOS = ['1°', '2°', '3°', '4°', '5°', '6°'];
const SECCIONES = ['A', 'B', 'C', 'D'];

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
}

function formatBytes(bytes: number) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function formatDate(d: string) {
  if (!d) return '';
  try {
    const date = new Date(d);
    return date.toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch { return d; }
}

export default function VirtualClassroomScreenModernV2({ user }: { user: User }) {
  const [vista, setVista] = useState<VistaAula>('clases');
  const [aulas, setAulas] = useState<AulaLocal[]>([]);
  const [materiales, setMateriales] = useState<MaterialLocal[]>([]);
  const [entregas, setEntregas] = useState<EntregaLocal[]>([]);
  const [comentarios, setComentarios] = useState<ComentarioLocal[]>([]);
  const [aulaSeleccionada, setAulaSeleccionada] = useState<AulaLocal | null>(null);
  const [materialSeleccionado, setMaterialSeleccionado] = useState<MaterialLocal | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showMenu, setShowMenu] = useState<string | null>(null);

  const isTeacher = ['admin', 'director', 'subdirector', 'teacher'].includes(user.role);
  const isStudent = user.role === 'student';

  useEffect(() => {
    loadData();
  }, []);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const a = getAulas();
      const m = getMateriales();
      const e = getEntregas();
      const c = getComentarios();
      setAulas(a);
      setMateriales(m);
      setEntregas(e);
      setComentarios(c);

      try {
        const aulasCloud = await getAulasCloud();
        if (aulasCloud.length > 0) {
          setAulas(aulasCloud);
          guardarAulas(aulasCloud);
        }
        if (aulaSeleccionada) {
          const matsForAula = await getMaterialesAula(aulaSeleccionada.id);
          if (matsForAula.length > 0) {
            const allMats = [...materiales.filter(x => x.aulaId !== aulaSeleccionada.id), ...matsForAula];
            setMateriales(allMats);
            guardarMateriales(allMats);
          }
        }
      } catch (e) {
        console.warn('No se pudo sincronizar aula virtual desde la nube:', e);
      }
    } finally {
      setIsLoading(false);
    }
  }, [aulaSeleccionada]);

  const refreshMateriales = async (aulaId: string) => {
    try {
      const matsCloud = await getMaterialesAula(aulaId);
      if (matsCloud.length > 0) {
        const others = materiales.filter(m => m.aulaId !== aulaId);
        const merged = [...others, ...matsCloud];
        setMateriales(merged);
        guardarMateriales(merged);
        return matsCloud;
      }
    } catch {}
    return [];
  };

  const filteredAulas = aulas.filter(a =>
    a.estado !== 'archivada' &&
    (a.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
     a.curso.toLowerCase().includes(searchTerm.toLowerCase()) ||
     a.docenteId.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const materialesAula = aulaSeleccionada
    ? materiales.filter(m => m.aulaId === aulaSeleccionada.id)
    : [];

  const tareasAula = materialesAula.filter(m => m.tipo === 'tarea');

  return (
    <div className="min-h-screen bg-slate-900/50 overflow-hidden">
      <div className="fixed inset-0 -z-50">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/5 via-transparent to-purple-600/5" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <HeaderElegante
          icon={BookOpen}
          title="AULA VIRTUAL"
          subtitle="Gestiona tus clases, tareas, recursos y entregas"
        >
          {isTeacher && vista === 'clases' && (
            <button
              onClick={() => setVista('crear-aula')}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-lg text-sm font-medium transition-all shadow-lg shadow-indigo-500/20"
            >
              <Plus className="w-4 h-4" /> Nueva Aula
            </button>
          )}
          {aulaSeleccionada && isTeacher && vista === 'detalle' && (
            <button
              onClick={() => setVista('crear-material')}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-lg text-sm font-medium transition-all shadow-lg shadow-indigo-500/20"
            >
              <Plus className="w-4 h-4" /> Nuevo Material
            </button>
          )}
        </HeaderElegante>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-10 h-10 rounded-full border-4 border-slate-300/20 border-t-indigo-500 animate-spin" />
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {vista === 'clases' && (
              <VistaClases
                key="clases"
                aulas={filteredAulas}
                searchTerm={searchTerm}
                onSearch={setSearchTerm}
                onSelect={(aula) => {
                  setAulaSeleccionada(aula);
                  setVista('detalle');
                }}
                onDelete={async (aula) => {
                  if (!confirm(`¿Eliminar el aula "${aula.nombre}" y todos sus materiales?`)) return;
                  const nuevas = aulas.filter(a => a.id !== aula.id);
                  setAulas(nuevas);
                  guardarAulas(nuevas);
                  const newMats = materiales.filter(m => m.aulaId !== aula.id);
                  setMateriales(newMats);
                  guardarMateriales(newMats);
                  try { await eliminarAula(aula.id); } catch {}
                }}
                onArchive={async (aula) => {
                  const updated = aulas.map(a => a.id === aula.id ? { ...a, estado: 'archivada' } : a);
                  setAulas(updated);
                  guardarAulas(updated);
                  try { await actualizarAula(aula.id, { ...aula, estado: 'archivada' }); } catch {}
                }}
                materiales={materiales}
                entregas={entregas}
                user={user}
              />
            )}

            {vista === 'detalle' && aulaSeleccionada && (
              <VistaDetalleAula
                key={`detalle-${aulaSeleccionada.id}`}
                aula={aulaSeleccionada}
                materiales={materialesAula}
                entregas={entregas}
                comentarios={comentarios}
                user={user}
                onBack={() => { setVista('clases'); setAulaSeleccionada(null); }}
                onMaterialClick={(mat) => setMaterialSeleccionado(mat)}
                onDeleteMaterial={async (mat) => {
                  if (!confirm(`¿Eliminar "${mat.titulo}"?`)) return;
                  const newMats = materiales.filter(m => m.id !== mat.id);
                  setMateriales(newMats);
                  guardarMateriales(newMats);
                  try { await eliminarMaterial(mat.id); } catch {}
                }}
                onRefreshMateriales={() => refreshMateriales(aulaSeleccionada.id)}
                onAddMaterial={() => setVista('crear-material')}
              />
            )}

            {vista === 'crear-aula' && (
              <FormularioCrearAula
                key="crear-aula"
                user={user}
                onSave={async (aula) => {
                  const nuevas = [...aulas.filter(a => a.id !== aula.id), aula];
                  setAulas(nuevas);
                  guardarAulas(nuevas);
                  try { await crearAula(aula); } catch {}
                  setAulaSeleccionada(aula);
                  setVista('detalle');
                }}
                onCancel={() => setVista('clases')}
              />
            )}

            {vista === 'crear-material' && aulaSeleccionada && (
              <FormularioCrearMaterial
                key="crear-material"
                aula={aulaSeleccionada}
                user={user}
                onSave={async (material) => {
                  const newMats = [...materiales.filter(m => m.id !== material.id), material];
                  setMateriales(newMats);
                  guardarMateriales(newMats);
                  try { await crearMaterial(material); } catch {}
                  setVista('detalle');
                }}
                onCancel={() => setVista('detalle')}
              />
            )}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}

// ─── Vista de Clases ───────────────────────────────────────────────────────

function VistaClases({ aulas, searchTerm, onSearch, onSelect, onDelete, onArchive, materiales, entregas, user }: {
  aulas: AulaLocal[];
  searchTerm: string;
  onSearch: (s: string) => void;
  onSelect: (aula: AulaLocal) => void;
  onDelete: (aula: AulaLocal) => void;
  onArchive: (aula: AulaLocal) => void;
  materiales: MaterialLocal[];
  entregas: EntregaLocal[];
  user: User;
}) {
  const isTeacher = ['admin', 'director', 'subdirector', 'teacher'].includes(user.role);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => onSearch(e.target.value)}
            placeholder="Buscar aula por nombre, curso o docente..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 text-sm placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {aulas.length === 0 ? (
        <div className="text-center py-16">
          <BookOpen className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-slate-400 mb-2">No hay aulas virtuales</h3>
          <p className="text-slate-500 text-sm">
            {isTeacher ? 'Crea una nueva aula virtual para comenzar a compartir recursos con tus estudiantes.'
                       : 'Aún no se han creado aulas virtuales. Consulta con tu docente.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {aulas.map((aula, i) => {
            const mats = materiales.filter(m => m.aulaId === aula.id);
            const tareas = mats.filter(m => m.tipo === 'tarea');
            const myEntregas = entregas.filter(e => e.aulaId === aula.id && e.alumnoId === user.id);
            const pendingTasks = tareas.filter(t => !myEntregas.find(e => e.materialId === t.id && e.estado !== 'pendiente'));

            return (
              <div key={aula.id} className="group">
                <ElegantCard index={i} className="h-full" hover>
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div
                        className="p-2.5 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 text-white cursor-pointer"
                        onClick={() => onSelect(aula)}
                      >
                        <BookOpen className="w-5 h-5" />
                      </div>
                      {isTeacher && (
                        <div className="relative">
                          <button onClick={() => {}} className="p-1 text-slate-400 hover:text-slate-200 transition-colors">
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="cursor-pointer" onClick={() => onSelect(aula)}>
                      <h3 className="font-bold text-slate-100 text-lg group-hover:text-indigo-300 transition-colors">
                        {aula.nombre}
                      </h3>
                      {aula.curso && <p className="text-sm text-indigo-400 font-medium mt-0.5">{aula.curso}</p>}
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2">{aula.descripcion || 'Sin descripción'}</p>
                    </div>

                    <div className="flex flex-wrap gap-2 text-xs">
                      {aula.grado && (
                        <span className="px-2 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded">
                          {aula.grado} {aula.seccion}
                        </span>
                      )}
                      <span className="px-2 py-1 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded">
                        {mats.length} materiales
                      </span>
                      {tareas.length > 0 && (
                        <span className="px-2 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded">
                          {tareas.length} tareas
                        </span>
                      )}
                    </div>

                    {user.role === 'student' && pendingTasks.length > 0 && (
                      <div className="flex items-center gap-2 p-2 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                        <AlertCircle className="w-4 h-4 text-amber-400" />
                        <span className="text-xs text-amber-300">{pendingTasks.length} tarea(s) pendiente(s)</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-3 border-t border-slate-700/30">
                      <span className="text-xs text-slate-500">{formatDate(aula.creado)}</span>
                      <div className="flex gap-1">
                        {isTeacher && (
                          <>
                            <button
                              onClick={(e) => { e.stopPropagation(); onArchive(aula); }}
                              className="p-1.5 text-slate-400 hover:text-amber-400 transition-colors rounded"
                              title="Archivar"
                            >
                              <Inbox className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); onDelete(aula); }}
                              className="p-1.5 text-slate-400 hover:text-red-400 transition-colors rounded"
                              title="Eliminar"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => onSelect(aula)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium transition-colors"
                        >
                          Entrar <ChevronRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </ElegantCard>
              </div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}

// ─── Vista Detalle de Aula ─────────────────────────────────────────────────

function VistaDetalleAula({ aula, materiales, entregas, comentarios, user, onBack, onMaterialClick, onDeleteMaterial, onRefreshMateriales, onAddMaterial }: {
  aula: AulaLocal;
  materiales: MaterialLocal[];
  entregas: EntregaLocal[];
  comentarios: ComentarioLocal[];
  user: User;
  onBack: () => void;
  onMaterialClick: (mat: MaterialLocal) => void;
  onDeleteMaterial: (mat: MaterialLocal) => void;
  onRefreshMateriales: () => void;
  onAddMaterial: () => void;
}) {
  const [tab, setTab] = useState<'materiales' | 'tareas' | 'archivos'>('materiales');
  const isTeacher = ['admin', 'director', 'subdirector', 'teacher'].includes(user.role);
  const isStudent = user.role === 'student';

  const tareas = materiales.filter(m => m.tipo === 'tarea');
  const archivos = materiales.filter(m => m.tipo === 'archivo' || m.tipo === 'documento');
  const otros = materiales.filter(m => m.tipo !== 'tarea' && m.tipo !== 'archivo' && m.tipo !== 'documento');

  const getEntregasForTarea = (tareaId: string) => entregas.filter(e => e.materialId === tareaId);
  const getMyEntrega = (tareaId: string) => entregas.find(e => e.materialId === tareaId && e.alumnoId === user.id);

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
      <button onClick={onBack} className="flex items-center gap-2 text-slate-400 hover:text-slate-200 mb-4 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Volver a Aulas
      </button>

      <div className="bg-gradient-to-br from-indigo-600/10 to-purple-600/10 border border-indigo-500/20 rounded-xl p-6 mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-100">{aula.nombre}</h2>
            {aula.curso && <p className="text-indigo-300 font-medium mt-1">{aula.curso}</p>}
            {aula.descripcion && <p className="text-slate-400 text-sm mt-2 max-w-2xl">{aula.descripcion}</p>}
          </div>
          <div className="flex gap-2 text-xs">
            {aula.grado && <span className="px-3 py-1 bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-full">{aula.grado} {aula.seccion}</span>}
            <span className="px-3 py-1 bg-green-500/20 text-green-300 border border-green-500/30 rounded-full">Activa</span>
          </div>
        </div>

        <div className="flex gap-6 mt-4 text-sm">
          <div className="flex items-center gap-2 text-slate-300">
            <FileText className="w-4 h-4 text-indigo-400" /> {materiales.length} materiales
          </div>
          <div className="flex items-center gap-2 text-slate-300">
            <ClipboardList className="w-4 h-4 text-amber-400" /> {tareas.length} tareas
          </div>
          <div className="flex items-center gap-2 text-slate-300">
            <Calendar className="w-4 h-4 text-slate-400" /> Creada {formatDate(aula.creado)}
          </div>
        </div>
      </div>

      <div className="flex gap-3 mb-6 border-b border-slate-700/30 pb-4 overflow-x-auto">
        {[
          { id: 'materiales' as const, label: 'Todos los Materiales', icon: FolderOpen },
          { id: 'tareas' as const, label: 'Tareas', icon: ClipboardList },
          { id: 'archivos' as const, label: 'Archivos', icon: File },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
              tab === t.id
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
            }`}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
            {t.id === 'tareas' && tareas.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 bg-amber-500/20 text-amber-300 rounded text-xs">{tareas.length}</span>
            )}
          </button>
        ))}
      </div>

      {tab === 'materiales' && (
        <MaterialesList
          materiales={materiales}
          entregas={entregas}
          comentarios={comentarios}
          user={user}
          onMaterialClick={onMaterialClick}
          onDeleteMaterial={onDeleteMaterial}
          onAddMaterial={onAddMaterial}
          isTeacher={isTeacher}
        />
      )}

      {tab === 'tareas' && (
        <TareasList
          tareas={tareas}
          entregas={entregas}
          user={user}
          isTeacher={isTeacher}
          isStudent={isStudent}
          aulaId={aula.id}
          onRefresh={onRefreshMateriales}
        />
      )}

      {tab === 'archivos' && (
        <ArchivosList
          archivos={archivos}
          onMaterialClick={onMaterialClick}
          onDeleteMaterial={onDeleteMaterial}
          isTeacher={isTeacher}
          onAddMaterial={onAddMaterial}
        />
      )}
    </motion.div>
  );
}

// ─── Lista de Materiales ────────────────────────────────────────────────────

function MaterialesList({ materiales, entregas, comentarios, user, onMaterialClick, onDeleteMaterial, onAddMaterial, isTeacher }: {
  materiales: MaterialLocal[];
  entregas: EntregaLocal[];
  comentarios: ComentarioLocal[];
  user: User;
  onMaterialClick: (mat: MaterialLocal) => void;
  onDeleteMaterial: (mat: MaterialLocal) => void;
  onAddMaterial: () => void;
  isTeacher: boolean;
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (materiales.length === 0) {
    return (
      <div className="text-center py-12">
        <FolderOpen className="w-16 h-16 text-slate-600 mx-auto mb-4" />
        <p className="text-slate-400">No hay materiales en esta aula.</p>
        {isTeacher && (
          <button onClick={onAddMaterial} className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm inline-flex items-center gap-2">
            <Plus className="w-4 h-4" /> Agregar Material
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {materiales.map((mat) => {
        const config = TIPO_CONFIG[mat.tipo];
        const comCount = comentarios.filter(c => c.materialId === mat.id).length;
        const entCount = entregas.filter(e => e.materialId === mat.id).length;
        const isExpanded = expandedId === mat.id;

        return (
          <div key={mat.id} className="bg-slate-800/40 border border-slate-700/30 rounded-xl overflow-hidden hover:border-slate-600/50 transition-colors">
            <div className="flex items-center gap-4 p-4 cursor-pointer" onClick={() => setExpandedId(isExpanded ? null : mat.id)}>
              <div className={`p-3 rounded-lg ${config.bg} ${config.color}`}>
                {config.icon}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-slate-100 truncate">{mat.titulo}</h4>
                <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                  <span className={`${config.color}`}>{config.label}</span>
                  <span>{formatDate(mat.creado)}</span>
                  {mat.pesoArchivo > 0 && <span>{formatBytes(mat.pesoArchivo)}</span>}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {comCount > 0 && (
                  <span className="flex items-center gap-1 text-xs text-slate-400">
                    <MessageSquare className="w-3 h-3" /> {comCount}
                  </span>
                )}
                {mat.tipo === 'tarea' && entCount > 0 && (
                  <span className="flex items-center gap-1 text-xs text-slate-400">
                    <Users className="w-3 h-3" /> {entCount}
                  </span>
                )}
                <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
              </div>
            </div>

            <AnimatePresence>
              {isExpanded && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
                  <div className="px-4 pb-4 border-t border-slate-700/30">
                    {mat.descripcion && <p className="text-sm text-slate-300 mt-3">{mat.descripcion}</p>}
                    {mat.fechaEntrega && (
                      <div className="flex items-center gap-2 mt-3 text-xs text-amber-400">
                        <Calendar className="w-3.5 h-3.5" /> Fecha de entrega: {formatDate(mat.fechaEntrega)}
                      </div>
                    )}
                    {mat.url && (
                      <a href={mat.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 mt-3 text-xs text-indigo-400 hover:text-indigo-300">
                        <ExternalLink className="w-3.5 h-3.5" /> Abrir enlace
                      </a>
                    )}
                    <div className="flex gap-2 mt-4">
                      <button onClick={() => onMaterialClick(mat)} className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium flex items-center gap-1.5">
                        <Eye className="w-3.5 h-3.5" /> Ver detalle
                      </button>
                      {(mat.tipo === 'archivo' || mat.tipo === 'documento') && mat.nombreArchivo && (
                        <button
                          onClick={(e) => { e.stopPropagation(); descargarArchivo(mat); }}
                          className="px-3 py-1.5 bg-green-600 hover:bg-green-500 text-white rounded-lg text-xs font-medium flex items-center gap-1.5"
                        >
                          <Download className="w-3.5 h-3.5" /> Descargar
                        </button>
                      )}
                      {mat.tipo === 'enlace' && mat.url && (
                        <a href={mat.url} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-medium flex items-center gap-1.5">
                          <ExternalLink className="w-3.5 h-3.5" /> Abrir enlace
                        </a>
                      )}
                      {isTeacher && (
                        <button onClick={() => onDeleteMaterial(mat)} className="px-3 py-1.5 bg-red-600/20 hover:bg-red-600/40 text-red-400 rounded-lg text-xs font-medium flex items-center gap-1.5 ml-auto">
                          <Trash2 className="w-3.5 h-3.5" /> Eliminar
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}

// ─── Lista de Tareas ────────────────────────────────────────────────────────

function TareasList({ tareas, entregas, user, isTeacher, isStudent, aulaId, onRefresh }: {
  tareas: MaterialLocal[];
  entregas: EntregaLocal[];
  user: User;
  isTeacher: boolean;
  isStudent: boolean;
  aulaId: string;
  onRefresh: () => void;
}) {
  const [entregaModal, setEntregaModal] = useState<MaterialLocal | null>(null);
  const [entregaTexto, setEntregaTexto] = useState('');
  const [entregaArchivo, setEntregaArchivo] = useState<File | null>(null);
  const [calificando, setCalificando] = useState<string | null>(null);

  const getMyEntrega = (tareaId: string) => entregas.find(e => e.materialId === tareaId && e.alumnoId === user.id);

  const handleEntregar = async (tarea: MaterialLocal) => {
    if (!entregaTexto.trim() && !entregaArchivo) return;
    const id = `ent-${uid()}`;
    let contenido = entregaTexto;
    let nombreArchivo = '';
    let tipoArchivo = '';
    let pesoArchivo = 0;

    if (entregaArchivo) {
      nombreArchivo = entregaArchivo.name;
      tipoArchivo = entregaArchivo.type;
      pesoArchivo = entregaArchivo.size;
      try {
        const base64 = await fileToBase64(entregaArchivo);
        guardarEntregaArchivo(id, base64);
      } catch {}
    }

    const nuevaEntrega: EntregaLocal = {
      id, materialId: tarea.id, alumnoId: user.id, aulaId,
      contenido, nombreArchivo, tipoArchivo, pesoArchivo,
      nota: null, comentarioDoc: '', estado: 'entregado',
      creado: new Date().toISOString(), actualizado: new Date().toISOString(),
    };

    const nuevasEntregas = [...entregas.filter(e => e.id !== id), nuevaEntrega];
    guardarEntregas(nuevasEntregas);
    try { await crearEntrega(nuevaEntrega); } catch {}

    setEntregaModal(null);
    setEntregaTexto('');
    setEntregaArchivo(null);
    onRefresh();
  };

  const handleCalificar = async (entrega: EntregaLocal, nota: number, comentario: string) => {
    const updated = { ...entrega, nota, comentarioDoc: comentario, estado: 'calificado' as EstadoEntrega };
    const nuevasEntregas = entregas.map(e => e.id === entrega.id ? updated : e);
    guardarEntregas(nuevasEntregas);
    try { await actualizarEntrega(entrega.id, updated); } catch {}
    setCalificando(null);
  };

  const esTarde = (fechaEntrega: string) => {
    if (!fechaEntrega) return false;
    return new Date() > new Date(fechaEntrega);
  };

  return (
    <div className="space-y-4">
      {tareas.length === 0 ? (
        <div className="text-center py-12">
          <ClipboardList className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400">No hay tareas en esta aula.</p>
        </div>
      ) : (
        tareas.map((tarea, i) => {
          const myEntrega = getMyEntrega(tarea.id);
          const tareaEntregas = entregas.filter(e => e.materialId === tarea.id);
          const isOverdue = esTarde(tarea.fechaEntrega);

          return (
            <ElegantCard key={tarea.id} index={i} variant="minimal">
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="p-2.5 bg-amber-500/10 rounded-lg text-amber-400">
                      <ClipboardList className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-slate-100">{tarea.titulo}</h4>
                      {tarea.descripcion && <p className="text-sm text-slate-400 mt-1 line-clamp-2">{tarea.descripcion}</p>}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {tarea.fechaEntrega && (
                      <span className={`text-xs flex items-center gap-1 ${isOverdue ? 'text-red-400' : 'text-slate-400'}`}>
                        <Calendar className="w-3 h-3" />
                        {isOverdue ? 'Vencida: ' : 'Vence: '}{formatDate(tarea.fechaEntrega)}
                      </span>
                    )}
                    {isStudent && myEntrega && (
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        myEntrega.estado === 'calificado' ? 'bg-green-500/20 text-green-400' :
                        myEntrega.estado === 'entregado' ? 'bg-blue-500/20 text-blue-400' :
                        'bg-amber-500/20 text-amber-400'
                      }`}>
                        {myEntrega.estado === 'calificado' ? `Calificado (${myEntrega.nota})` :
                         myEntrega.estado === 'entregado' ? 'Entregado' : 'Pendiente'}
                      </span>
                    )}
                  </div>
                </div>

                {isStudent && !myEntrega && (
                  <div className="flex gap-2">
                    <button onClick={() => setEntregaModal(tarea)} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium flex items-center gap-2">
                      <Upload className="w-4 h-4" /> Entregar Tarea
                    </button>
                    {tarea.url && (
                      <a href={tarea.url} target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-sm flex items-center gap-2">
                        <ExternalLink className="w-4 h-4" /> Ver instrucciones
                      </a>
                    )}
                  </div>
                )}

                {isStudent && myEntrega && myEntrega.estado === 'calificado' && (
                  <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <Star className="w-4 h-4 text-yellow-400" />
                      <span className="text-sm text-green-300 font-medium">Nota: {myEntrega.nota}</span>
                    </div>
                    {myEntrega.comentarioDoc && <p className="text-sm text-slate-400 mt-1">"{myEntrega.comentarioDoc}"</p>}
                  </div>
                )}

                {isTeacher && tareaEntregas.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs text-slate-400 font-medium">Entregas ({tareaEntregas.length})</p>
                    {tareaEntregas.map(ent => (
                      <div key={ent.id} className="flex items-center justify-between bg-slate-700/30 rounded-lg px-3 py-2">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-300 flex items-center justify-center text-xs font-bold">
                            {ent.alumnoId.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-sm text-slate-300">{ent.alumnoId}</span>
                          <span className="text-xs text-slate-500">{formatDate(ent.creado)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {ent.estado === 'calificado' ? (
                            <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">{ent.nota}</span>
                          ) : (
                            <button onClick={() => setCalificando(ent.id)} className="text-xs text-indigo-400 hover:text-indigo-300">Calificar</button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {isTeacher && tareaEntregas.length === 0 && (
                  <p className="text-xs text-slate-500 text-center py-2">Sin entregas aún</p>
                )}
              </div>
            </ElegantCard>
          );
        })
      )}

      {entregaModal && (
        <EntregaModal
          tarea={entregaModal}
          onClose={() => { setEntregaModal(null); setEntregaTexto(''); setEntregaArchivo(null); }}
          onEntregar={handleEntregar}
          texto={entregaTexto}
          setTexto={setEntregaTexto}
          archivo={entregaArchivo}
          setArchivo={setEntregaArchivo}
        />
      )}
    </div>
  );
}

// ─── Modal de Entrega ───────────────────────────────────────────────────────

function EntregaModal({ tarea, onClose, onEntregar, texto, setTexto, archivo, setArchivo }: {
  tarea: MaterialLocal;
  onClose: () => void;
  onEntregar: (tarea: MaterialLocal) => void;
  texto: string;
  setTexto: (t: string) => void;
  archivo: File | null;
  setArchivo: (f: File | null) => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={onClose}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} onClick={e => e.stopPropagation()}
        className="w-full max-w-lg bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-slate-100">Entregar Tarea</h3>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-200"><X className="w-5 h-5" /></button>
        </div>
        <p className="text-sm text-slate-400 mb-4">{tarea.titulo}</p>
        {tarea.descripcion && <p className="text-sm text-slate-300 bg-slate-700/50 rounded-lg p-3 mb-4">{tarea.descripcion}</p>}

        <textarea
          value={texto}
          onChange={e => setTexto(e.target.value)}
          placeholder="Escribe tu respuesta aquí..."
          className="w-full h-32 bg-slate-700 border border-slate-600 rounded-lg p-3 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 resize-none mb-4"
        />

        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-300 mb-2">Adjuntar archivo (opcional)</label>
          <div className="relative">
            <input
              type="file"
              onChange={e => setArchivo(e.target.files?.[0] || null)}
              className="w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-indigo-600 file:text-white hover:file:bg-indigo-500 file:cursor-pointer"
            />
          </div>
          {archivo && <p className="text-xs text-slate-400 mt-1">{archivo.name} ({formatBytes(archivo.size)})</p>}
        </div>

        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-slate-400 hover:text-slate-200 text-sm">Cancelar</button>
          <button onClick={() => onEntregar(tarea)} className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium flex items-center gap-2">
            <Send className="w-4 h-4" /> Entregar
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Lista de Archivos ──────────────────────────────────────────────────────

function ArchivosList({ archivos, onMaterialClick, onDeleteMaterial, isTeacher, onAddMaterial }: {
  archivos: MaterialLocal[];
  onMaterialClick: (mat: MaterialLocal) => void;
  onDeleteMaterial: (mat: MaterialLocal) => void;
  isTeacher: boolean;
  onAddMaterial: () => void;
}) {
  if (archivos.length === 0) {
    return (
      <div className="text-center py-12">
        <File className="w-16 h-16 text-slate-600 mx-auto mb-4" />
        <p className="text-slate-400">No hay archivos en esta aula.</p>
        {isTeacher && (
          <button onClick={onAddMaterial} className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm inline-flex items-center gap-2">
            <Plus className="w-4 h-4" /> Subir Archivo
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {archivos.map((mat) => {
        const config = TIPO_CONFIG[mat.tipo];
        return (
          <div key={mat.id} className="flex items-center gap-4 p-3 bg-slate-800/40 border border-slate-700/30 rounded-xl hover:border-slate-600/50 transition-colors group">
            <div className={`p-3 rounded-lg ${config.bg} ${config.color}`}>
              {mat.tipo === 'documento' ? <FileText className="w-5 h-5" /> : <File className="w-5 h-5" />}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-slate-100 truncate">{mat.titulo}</h4>
              <div className="flex items-center gap-3 text-xs text-slate-400">
                {mat.nombreArchivo && <span>{mat.nombreArchivo}</span>}
                {mat.pesoArchivo > 0 && <span>{formatBytes(mat.pesoArchivo)}</span>}
                <span>{formatDate(mat.creado)}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => descargarArchivo(mat)} className="p-2 text-green-400 hover:bg-green-500/10 rounded-lg transition-colors" title="Descargar">
                <Download className="w-4 h-4" />
              </button>
              {isTeacher && (
                <button onClick={() => onDeleteMaterial(mat)} className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100" title="Eliminar">
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Formulario Crear Aula ──────────────────────────────────────────────────

function FormularioCrearAula({ user, onSave, onCancel }: {
  user: User;
  onSave: (aula: AulaLocal) => void;
  onCancel: () => void;
}) {
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [curso, setCurso] = useState('');
  const [grado, setGrado] = useState('');
  const [seccion, setSeccion] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) return;
    setSaving(true);
    const aula: AulaLocal = {
      id: `aula-${uid()}`,
      nombre: nombre.trim(),
      descripcion: descripcion.trim(),
      docenteId: user.id,
      grado, seccion, curso,
      imagen: '',
      estado: 'activa',
      creado: new Date().toISOString(),
      actualizado: new Date().toISOString(),
    };
    onSave(aula);
    setSaving(false);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
      <div className="max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold text-slate-100 mb-6">Crear Nueva Aula Virtual</h2>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Nombre del Aula *</label>
            <input type="text" value={nombre} onChange={e => setNombre(e.target.value)} required
              className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
              placeholder="Ej: Comunicación I - 3° A" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Descripción</label>
            <textarea value={descripcion} onChange={e => setDescripcion(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 resize-none h-24"
              placeholder="Describe el contenido y objetivos de esta aula..." />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Curso / Materia</label>
            <input type="text" value={curso} onChange={e => setCurso(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
              placeholder="Ej: Comunicación, Matemática, Historia..." />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Grado</label>
              <select value={grado} onChange={e => setGrado(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500">
                <option value="">Seleccionar</option>
                {GRADOS.map(g => <option key={g} value={g}>{g} Grado</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Sección</label>
              <select value={seccion} onChange={e => setSeccion(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500">
                <option value="">Seleccionar</option>
                {SECCIONES.map(s => <option key={s} value={s}>Sección {s}</option>)}
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={onCancel} className="px-6 py-2.5 text-slate-400 hover:text-slate-200 text-sm">Cancelar</button>
            <button type="submit" disabled={saving || !nombre.trim()}
              className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
              {saving ? (<><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Creando...</>) : 'Crear Aula'}
            </button>
          </div>
        </form>
      </div>
    </motion.div>
  );
}

// ─── Formulario Crear Material ──────────────────────────────────────────────

function FormularioCrearMaterial({ aula, user, onSave, onCancel }: {
  aula: AulaLocal;
  user: User;
  onSave: (material: MaterialLocal) => void;
  onCancel: () => void;
}) {
  const [tipo, setTipo] = useState<TipoMaterial>('archivo');
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [url, setUrl] = useState('');
  const [fechaEntrega, setFechaEntrega] = useState('');
  const [archivo, setArchivo] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim()) return;
    setSaving(true);

    const id = `mat-${uid()}`;
    let contenido = '';
    let nombreArchivo = '';
    let tipoArchivo = '';
    let pesoArchivo = 0;

    if ((tipo === 'archivo' || tipo === 'documento') && archivo) {
      nombreArchivo = archivo.name;
      tipoArchivo = archivo.type;
      pesoArchivo = archivo.size;
      try {
        contenido = await fileToBase64(archivo);
        guardarArchivoAula(id, contenido);
        contenido = `[archivo_guardado:${id}]`;
      } catch {
        contenido = '';
      }
    }

    if (tipo === 'video' || tipo === 'enlace') {
      contenido = url;
    }

    const material: MaterialLocal = {
      id, aulaId: aula.id, tipo, titulo: titulo.trim(),
      descripcion: descripcion.trim(), contenido,
      url: tipo === 'video' || tipo === 'enlace' ? url : '',
      nombreArchivo, tipoArchivo, pesoArchivo,
      fechaEntrega, creadoPor: user.id,
      creado: new Date().toISOString(),
      actualizado: new Date().toISOString(),
    };

    onSave(material);
    setSaving(false);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
      <div className="max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold text-slate-100 mb-2">Agregar Material</h2>
        <p className="text-slate-400 text-sm mb-6">Aula: {aula.nombre}</p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Tipo de Material</label>
            <div className="grid grid-cols-5 gap-2">
              {(Object.entries(TIPO_CONFIG) as [TipoMaterial, typeof TIPO_CONFIG[TipoMaterial]][]).map(([key, cfg]) => (
                <button key={key} type="button" onClick={() => setTipo(key)}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border transition-all text-xs ${
                    tipo === key ? 'border-indigo-500 bg-indigo-500/10 text-indigo-300' : 'border-slate-700 bg-slate-800/50 text-slate-400 hover:border-slate-600'
                  }`}>
                  {cfg.icon}
                  {cfg.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Título *</label>
            <input type="text" value={titulo} onChange={e => setTitulo(e.target.value)} required
              className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
              placeholder={tipo === 'tarea' ? 'Ej: Ensayo sobre educación...' : 'Ej: Guía de Lectura - Capítulo 3'} />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Descripción</label>
            <textarea value={descripcion} onChange={e => setDescripcion(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 resize-none h-24"
              placeholder={tipo === 'tarea' ? 'Instrucciones para la tarea...' : 'Descripción del material...'} />
          </div>

          {(tipo === 'video' || tipo === 'enlace') && (
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                {tipo === 'video' ? 'URL del Video (YouTube, Vimeo, etc.)' : 'URL del Enlace'}
              </label>
              <input type="url" value={url} onChange={e => setUrl(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
                placeholder={tipo === 'video' ? 'https://www.youtube.com/watch?v=...' : 'https://...'} />
            </div>
          )}

          {(tipo === 'archivo' || tipo === 'documento' || tipo === 'tarea') && (
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Archivo adjunto</label>
              <input type="file" onChange={e => setArchivo(e.target.files?.[0] || null)}
                className="w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-indigo-600 file:text-white hover:file:bg-indigo-500 file:cursor-pointer" />
              {archivo && <p className="text-xs text-slate-400 mt-1">{archivo.name} ({formatBytes(archivo.size)})</p>}
              <p className="text-xs text-slate-500 mt-1">Tamaño máximo recomendado: 500 KB (archivos más grandes pueden fallar en modo offline)</p>
            </div>
          )}

          {tipo === 'tarea' && (
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Fecha de Entrega</label>
              <input type="date" value={fechaEntrega} onChange={e => setFechaEntrega(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500" />
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={onCancel} className="px-6 py-2.5 text-slate-400 hover:text-slate-200 text-sm">Cancelar</button>
            <button type="submit" disabled={saving || !titulo.trim()}
              className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
              {saving ? (<><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Guardando...</>) : 'Agregar Material'}
            </button>
          </div>
        </form>
      </div>
    </motion.div>
  );
}

// ─── Utilidades ─────────────────────────────────────────────────────────

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function descargarArchivo(material: MaterialLocal) {
  const contenido = obtenerArchivoAula(material.id);
  if (contenido) {
    const link = document.createElement('a');
    link.href = contenido;
    link.download = material.nombreArchivo || material.titulo;
    link.click();
  } else if (material.url) {
    window.open(material.url, '_blank');
  }
}