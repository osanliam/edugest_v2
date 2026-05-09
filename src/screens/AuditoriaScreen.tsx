import React, { useState, useEffect } from 'react';
import { Shield, Download, RefreshCw, Database, Clock, User, Activity, AlertTriangle, Archive, ChevronDown, ChevronRight } from 'lucide-react';
import { getAuditoria, getHistorialCalificativo, getBackups, crearBackupManual, descargarBackup } from '../utils/apiClient';

interface AuditoriaProps {
  user?: { role?: string; name?: string };
}

const ACCION_ESTILO: Record<string, string> = {
  save:   'bg-emerald-900/50 text-emerald-300 border-emerald-600',
  merge:  'bg-orange-900/50 text-orange-300 border-orange-600',
  delete: 'bg-red-900/50 text-red-300 border-red-600',
};

export default function AuditoriaScreen({ user }: AuditoriaProps) {
  const [tab, setTab]                 = useState<'logs' | 'backups'>('logs');
  const [logs, setLogs]               = useState<any[]>([]);
  const [backups, setBackups]         = useState<any[]>([]);
  const [cargando, setCargando]       = useState(false);
  const [filtroDte, setFiltroDte]     = useState('');
  const [filtroAccion, setFiltroAccion] = useState('');
  const [expandido, setExpandido]     = useState<string | null>(null);
  const [historial, setHistorial]     = useState<Record<string, any[]>>({});
  const [creandoBkp, setCreandoBkp]   = useState(false);
  const [msg, setMsg]                 = useState<{ tipo: 'ok'|'err'; texto: string } | null>(null);

  const cargarLogs = async () => {
    setCargando(true);
    try {
      const data = await getAuditoria(200);
      setLogs(data);
    } catch (e: any) {
      setMsg({ tipo: 'err', texto: `Error: ${e.message}` });
    } finally {
      setCargando(false);
    }
  };

  const cargarBackups = async () => {
    setCargando(true);
    try {
      const data = await getBackups();
      setBackups(data);
    } catch (e: any) {
      setMsg({ tipo: 'err', texto: `Error: ${e.message}` });
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    if (tab === 'logs') cargarLogs();
    else cargarBackups();
  }, [tab]);

  const toggleHistorial = async (logId: string, registroId: string) => {
    if (expandido === logId) { setExpandido(null); return; }
    setExpandido(logId);
    if (!historial[registroId]) {
      try {
        const h = await getHistorialCalificativo(registroId);
        setHistorial(prev => ({ ...prev, [registroId]: h }));
      } catch {}
    }
  };

  const handleCrearBackup = async () => {
    setCreandoBkp(true);
    setMsg(null);
    try {
      const r = await crearBackupManual();
      setMsg({ tipo: 'ok', texto: `✅ Backup creado: ${r.id}` });
      await cargarBackups();
    } catch (e: any) {
      setMsg({ tipo: 'err', texto: `❌ ${e.message}` });
    } finally {
      setCreandoBkp(false);
      setTimeout(() => setMsg(null), 5000);
    }
  };

  const handleDescargar = async (id: string) => {
    try {
      await descargarBackup(id);
    } catch (e: any) {
      setMsg({ tipo: 'err', texto: `❌ ${e.message}` });
      setTimeout(() => setMsg(null), 4000);
    }
  };

  const logsFiltrados = logs.filter(l => {
    const matchDte    = !filtroDte    || (l.usuario_id || '').toLowerCase().includes(filtroDte.toLowerCase());
    const matchAccion = !filtroAccion || l.accion === filtroAccion;
    return matchDte && matchAccion;
  });

  const stats = {
    total:   logs.length,
    saves:   logs.filter(l => l.accion === 'save').length,
    merges:  logs.filter(l => l.accion === 'merge').length,
    docentes: [...new Set(logs.map(l => l.usuario_id).filter(Boolean))].length,
  };

  // Restricción de acceso
  const rolesPermitidos = ['admin', 'director', 'subdirector'];
  if (user?.role && !rolesPermitidos.includes(user.role)) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Shield className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <p className="text-white font-bold text-xl">Acceso restringido</p>
          <p className="text-slate-400 mt-2">Solo admin, director y subdirector pueden ver la auditoría.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 md:p-6">

      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <Shield className="w-7 h-7 text-violet-400" /> Auditoría del Sistema
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Registro de quién cambió qué y cuándo · Backups automáticos</p>
        </div>
        <button onClick={() => tab === 'logs' ? cargarLogs() : cargarBackups()} disabled={cargando}
          className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-sm font-bold disabled:opacity-50">
          <RefreshCw size={14} className={cargando ? 'animate-spin' : ''} /> Actualizar
        </button>
      </div>

      {/* Mensaje */}
      {msg && (
        <div className={`mb-4 px-4 py-2 rounded-xl border text-sm font-bold ${
          msg.tipo === 'ok' ? 'bg-emerald-900/40 border-emerald-600 text-emerald-300' : 'bg-red-900/40 border-red-600 text-red-300'
        }`}>{msg.texto}</div>
      )}

      {/* Stats rápidas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total acciones', value: stats.total,   icon: <Activity size={18} />, color: 'text-cyan-400' },
          { label: 'Guardados',      value: stats.saves,   icon: <Database size={18} />, color: 'text-emerald-400' },
          { label: 'Merges',         value: stats.merges,  icon: <AlertTriangle size={18} />, color: 'text-orange-400' },
          { label: 'Docentes activos',value: stats.docentes,icon: <User size={18} />, color: 'text-violet-400' },
        ].map(s => (
          <div key={s.label} className="bg-slate-800/60 border border-slate-700 rounded-xl p-4">
            <div className={`${s.color} mb-1`}>{s.icon}</div>
            <p className="text-2xl font-black text-white">{s.value}</p>
            <p className="text-slate-400 text-xs">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        {(['logs', 'backups'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
              tab === t ? 'bg-violet-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}>
            {t === 'logs' ? '📋 Historial de cambios' : '💾 Backups'}
          </button>
        ))}
      </div>

      {/* ── TAB LOGS ── */}
      {tab === 'logs' && (
        <div className="bg-slate-800/60 border border-slate-700 rounded-2xl overflow-hidden">

          {/* Filtros */}
          <div className="p-4 border-b border-slate-700 flex gap-3 flex-wrap">
            <input
              type="text" placeholder="Filtrar por docente..."
              value={filtroDte} onChange={e => setFiltroDte(e.target.value)}
              className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-violet-500 placeholder-slate-500 w-52"
            />
            <select value={filtroAccion} onChange={e => setFiltroAccion(e.target.value)}
              className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-violet-500">
              <option value="">Todas las acciones</option>
              <option value="save">save</option>
              <option value="merge">merge</option>
              <option value="delete">delete</option>
            </select>
            <span className="text-slate-400 text-sm self-center">{logsFiltrados.length} registros</span>
          </div>

          {/* Tabla */}
          <div className="overflow-x-auto">
            {cargando ? (
              <div className="p-12 text-center text-slate-400">
                <RefreshCw size={24} className="animate-spin mx-auto mb-2" /> Cargando logs...
              </div>
            ) : logsFiltrados.length === 0 ? (
              <div className="p-12 text-center text-slate-500">
                <Shield size={32} className="mx-auto mb-2 opacity-40" />
                <p>No hay registros de auditoría aún.</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700 bg-slate-900/40">
                    <th className="text-left px-4 py-3 text-slate-400 font-semibold text-xs uppercase tracking-wide">Fecha/Hora</th>
                    <th className="text-left px-4 py-3 text-slate-400 font-semibold text-xs uppercase tracking-wide">Docente</th>
                    <th className="text-left px-4 py-3 text-slate-400 font-semibold text-xs uppercase tracking-wide">Acción</th>
                    <th className="text-left px-4 py-3 text-slate-400 font-semibold text-xs uppercase tracking-wide">Tabla</th>
                    <th className="text-left px-4 py-3 text-slate-400 font-semibold text-xs uppercase tracking-wide">Cambios</th>
                    <th className="text-left px-4 py-3 text-slate-400 font-semibold text-xs uppercase tracking-wide">IP</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {logsFiltrados.map(log => {
                    const cambios = log.cambios ? (() => { try { return JSON.parse(log.cambios); } catch { return null; } })() : null;
                    const esMerge = log.accion === 'merge';
                    return (
                      <React.Fragment key={log.id}>
                        <tr className={`hover:bg-slate-700/30 ${esMerge ? 'bg-orange-900/10' : ''}`}>
                          <td className="px-4 py-3 text-slate-300 whitespace-nowrap">
                            <div className="flex items-center gap-1.5 text-xs">
                              <Clock size={12} className="text-slate-500" />
                              {log.timestamp ? new Date(log.timestamp).toLocaleString('es-PE', {
                                day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
                              }) : '—'}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-white text-xs font-mono bg-slate-700 px-2 py-0.5 rounded">
                              {log.usuario_id || 'anonymous'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded border text-xs font-bold ${ACCION_ESTILO[log.accion] || 'bg-slate-700 text-slate-300 border-slate-600'}`}>
                              {log.accion}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-400 text-xs">{log.tabla}</td>
                          <td className="px-4 py-3 text-xs text-slate-300 max-w-xs truncate">
                            {cambios ? (
                              <span className="text-slate-400">
                                {cambios.alumnoId ? `alumno: ${cambios.alumnoId.slice(0,8)}…` : ''}{' '}
                                {cambios.calificativo ? <span className={`font-bold ${cambios.calificativo === 'A' ? 'text-emerald-400' : cambios.calificativo === 'AD' ? 'text-violet-400' : cambios.calificativo === 'B' ? 'text-amber-400' : 'text-red-400'}`}>{cambios.calificativo}</span> : ''}
                              </span>
                            ) : (
                              <span className="text-slate-600 italic">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-slate-500 text-xs font-mono">{log.ip?.split(',')[0] || '—'}</td>
                          <td className="px-4 py-3">
                            <button onClick={() => toggleHistorial(log.id, log.registro_id)}
                              className="text-slate-500 hover:text-violet-400 transition-colors">
                              {expandido === log.id ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                            </button>
                          </td>
                        </tr>

                        {/* Fila expandida con historial */}
                        {expandido === log.id && (
                          <tr>
                            <td colSpan={7} className="px-6 py-3 bg-slate-900/60 border-t border-slate-700/50">
                              <p className="text-xs text-slate-500 mb-2 font-semibold">Historial de versiones para {log.registro_id}:</p>
                              {(historial[log.registro_id] || []).length === 0 ? (
                                <p className="text-xs text-slate-600 italic">Sin versiones anteriores registradas.</p>
                              ) : (
                                <div className="space-y-1">
                                  {(historial[log.registro_id] || []).map((h: any, i: number) => {
                                    const prev = h.datos_anteriores ? (() => { try { return JSON.parse(h.datos_anteriores); } catch { return null; } })() : null;
                                    const next = h.datos_nuevos ? (() => { try { return JSON.parse(h.datos_nuevos); } catch { return null; } })() : null;
                                    return (
                                      <div key={i} className="flex items-center gap-3 text-xs bg-slate-800 rounded-lg px-3 py-2">
                                        <span className="text-slate-500">{h.timestamp ? new Date(h.timestamp).toLocaleString('es-PE') : '—'}</span>
                                        <span className="text-slate-400">docente: <span className="text-white font-mono">{h.docenteId || '?'}</span></span>
                                        {prev?.calificativo && <span className="text-red-400 line-through">{prev.calificativo}</span>}
                                        {next?.calificativo && <span className="text-emerald-400">→ {next.calificativo}</span>}
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ── TAB BACKUPS ── */}
      {tab === 'backups' && (
        <div className="space-y-4">

          {/* Acción crear backup */}
          <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-5 flex items-center justify-between gap-4 flex-wrap">
            <div>
              <p className="text-white font-bold">Crear backup manual</p>
              <p className="text-slate-400 text-sm mt-0.5">Snapshot inmediato de toda la base de datos. Los backups automáticos se crean a las 2:00 AM diariamente.</p>
            </div>
            <button onClick={handleCrearBackup} disabled={creandoBkp}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:opacity-90 text-white font-bold rounded-xl text-sm disabled:opacity-50">
              <Archive size={16} className={creandoBkp ? 'animate-pulse' : ''} />
              {creandoBkp ? 'Creando...' : 'Crear backup ahora'}
            </button>
          </div>

          {/* Lista de backups */}
          <div className="bg-slate-800/60 border border-slate-700 rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-700">
              <h3 className="text-white font-bold">Backups guardados</h3>
              <p className="text-slate-400 text-xs mt-0.5">Se conservan los últimos 30 backups. Cada uno incluye todas las tablas.</p>
            </div>

            {cargando ? (
              <div className="p-10 text-center text-slate-400">
                <RefreshCw size={24} className="animate-spin mx-auto mb-2" /> Cargando...
              </div>
            ) : backups.length === 0 ? (
              <div className="p-10 text-center text-slate-500">
                <Archive size={32} className="mx-auto mb-2 opacity-40" />
                <p>No hay backups aún. El primero se creará esta noche a las 2:00 AM.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-700/50">
                {backups.map((bk: any) => {
                  const resumen = bk.resumen ? (() => { try { return JSON.parse(bk.resumen); } catch { return null; } })() : null;
                  return (
                    <div key={bk.id} className="px-5 py-4 flex items-center gap-4 hover:bg-slate-700/20 flex-wrap">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`px-2 py-0.5 rounded text-xs font-bold border ${
                            bk.tipo === 'auto' ? 'bg-cyan-900/40 text-cyan-300 border-cyan-600' : 'bg-violet-900/40 text-violet-300 border-violet-600'
                          }`}>
                            {bk.tipo === 'auto' ? '🤖 Auto' : '👤 Manual'}
                          </span>
                          <span className="text-white text-sm font-mono">{bk.id}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-slate-400">
                          <Clock size={11} />
                          {bk.timestamp ? new Date(bk.timestamp).toLocaleString('es-PE') : '—'}
                        </div>
                        {resumen && (
                          <div className="flex gap-3 mt-1.5 flex-wrap">
                            {Object.entries(resumen).map(([k, v]) => (
                              <span key={k} className="text-[11px] text-slate-500">
                                {k}: <span className="text-slate-300">{String(v)}</span>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <button onClick={() => handleDescargar(bk.id)}
                        className="flex items-center gap-1.5 px-3 py-2 bg-slate-700 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors flex-shrink-0">
                        <Download size={13} /> Descargar
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
