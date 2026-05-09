import { useState } from 'react';
import { Activity, Wifi, WifiOff, AlertCircle, CheckCircle, Server, Database } from 'lucide-react';

interface DiagnosticoResult {
  ok: boolean;
  mensaje?: string;
  error?: string;
  diagnosticos?: Array<{
    paso: string;
    ok: boolean;
    detalles?: any;
    error?: string;
    count?: number;
  }>;
}

export default function PanelDiagnostico() {
  const [corriendo, setCorriendo] = useState(false);
  const [resultado, setResultado] = useState<DiagnosticoResult | null>(null);
  const [error, setError] = useState('');

  const ejecutar = async () => {
    setCorriendo(true);
    setResultado(null);
    setError('');
    try {
      const res = await fetch('/api/diagnostico', { method: 'GET' });
      const data = await res.json();
      setResultado(data);
    } catch (e: any) {
      setError('No se pudo contactar al servidor. ¿Está desplegado en Vercel? Error: ' + e.message);
    } finally {
      setCorriendo(false);
    }
  };

  return (
    <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Activity size={20} className="text-cyan-400" />
          <div>
            <h3 className="text-white font-bold text-sm">Diagnóstico de Conexión</h3>
            <p className="text-slate-400 text-xs">Verifica si Turso y las APIs están funcionando</p>
          </div>
        </div>
        <button
          onClick={ejecutar}
          disabled={corriendo}
          className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-700 text-white rounded-lg text-xs font-bold transition-colors"
        >
          {corriendo ? 'Verificando...' : 'Ejecutar diagnóstico'}
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-300 text-xs">
          <AlertCircle size={14} />
          {error}
        </div>
      )}

      {resultado && (
        <div className="space-y-3">
          <div className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold ${resultado.ok ? 'bg-green-500/10 text-green-400 border border-green-500/30' : 'bg-red-500/10 text-red-400 border border-red-500/30'}`}>
            {resultado.ok ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
            {resultado.mensaje || resultado.error || 'Diagnóstico completo'}
          </div>

          {resultado.error && resultado.error.includes('configurada') && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 space-y-2">
              <p className="text-amber-300 text-xs font-bold">⚠️ Variables de entorno faltantes en Vercel</p>
              <p className="text-slate-300 text-xs">
                Ve al dashboard de Vercel de tu proyecto:<br />
                <strong>Settings → Environment Variables</strong><br />
                Agrega estas dos variables:
              </p>
              <div className="bg-slate-900 rounded p-2 space-y-1 font-mono text-[10px]">
                <div className="text-cyan-400">TURSO_CONNECTION_URL = libsql://tu-db.turso.io</div>
                <div className="text-cyan-400">TURSO_AUTH_TOKEN = eyJhbGciOiJIUzI1NiIs...</div>
              </div>
              <p className="text-slate-400 text-[10px]">
                Después haz click en <strong>Redeploy</strong> para que se apliquen.
              </p>
            </div>
          )}

          {resultado.diagnosticos && (
            <div className="space-y-1.5">
              {resultado.diagnosticos.map((d, i) => (
                <div key={i} className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs ${d.ok ? 'bg-green-500/5 border border-green-500/10' : 'bg-red-500/5 border border-red-500/10'}`}>
                  <div className="flex items-center gap-2">
                    {d.ok ? <CheckCircle size={10} className="text-green-400" /> : <AlertCircle size={10} className="text-red-400" />}
                    <span className={d.ok ? 'text-green-300' : 'text-red-300'}>{d.paso}</span>
                  </div>
                  <div className="text-right">
                    {d.count !== undefined && <span className="text-slate-400 mr-2">{d.count}</span>}
                    {d.error && <span className="text-red-400 text-[10px]">{d.error}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
