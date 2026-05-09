import { useState } from 'react';
import { Database, Upload, Cloud, CheckCircle, XCircle, Loader2, Circle } from 'lucide-react';
import { migrarDatosLocalesAFirebase } from '../services/firebaseDataService';
import { isFirebaseConfigured } from '../lib/firebase';

function parsearMensaje(msg: string) {
  if (msg.includes('migrados')) return { icono: CheckCircle, color: 'text-green-400', texto: msg.replace(/^[✅🔄❌⚪]\s*/, '') };
  if (msg.includes('error')) return { icono: XCircle, color: 'text-red-400', texto: msg.replace(/^[✅🔄❌⚪]\s*/, '') };
  if (msg.includes('subiendo')) return { icono: Loader2, color: 'text-blue-400', texto: msg.replace(/^[✅🔄❌⚪]\s*/, '') };
  return { icono: Circle, color: 'text-slate-400', texto: msg.replace(/^[✅🔄❌⚪]\s*/, '') };
}

export default function MigrarFirebasePanel() {
  const [corriendo, setCorriendo] = useState(false);
  const [resultado, setResultado] = useState<string[] | null>(null);

  const ejecutar = async () => {
    setCorriendo(true);
    setResultado(null);
    const res = await migrarDatosLocalesAFirebase();
    setResultado(res.mensajes);
    setCorriendo(false);
  };

  if (!isFirebaseConfigured()) {
    return (
      <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-5 space-y-3">
        <div className="flex items-center gap-3">
          <Cloud size={20} className="text-amber-400" />
          <h3 className="text-amber-300 font-bold text-sm">Firebase no configurado</h3>
        </div>
        <p className="text-slate-400 text-xs">
          Para activar la sincronización en la nube, configura las variables de entorno en un archivo <code className="bg-slate-800 px-1 rounded">.env.local</code>:
        </p>
        <div className="bg-slate-900 rounded-lg p-3 font-mono text-[10px] text-cyan-400 space-y-1">
          <div>VITE_FIREBASE_API_KEY=tu-api-key</div>
          <div>VITE_FIREBASE_AUTH_DOMAIN=tu-proyecto.firebaseapp.com</div>
          <div>VITE_FIREBASE_PROJECT_ID=tu-proyecto</div>
        </div>
        <p className="text-slate-500 text-[10px]">
          Obtén estos valores en: <a href="https://console.firebase.google.com" target="_blank" rel="noopener" className="text-cyan-400 underline">Firebase Console</a> → Configuración del proyecto → Apps Web
        </p>
      </div>
    );
  }

  return (
    <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-5 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Database size={20} className="text-green-400" />
          <div>
            <h3 className="text-green-300 font-bold text-sm">Firebase activo</h3>
            <p className="text-slate-400 text-xs">Tus datos se sincronizan en la nube</p>
          </div>
        </div>
        <button
          onClick={ejecutar}
          disabled={corriendo}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-500 disabled:bg-slate-700 text-white rounded-lg text-xs font-bold transition-colors"
        >
          <Upload size={14} />
          {corriendo ? 'Migrando...' : 'Migrar datos locales'}
        </button>
      </div>

      {resultado && (
        <div className="bg-slate-900/50 rounded-lg p-3 space-y-2">
          <p className="text-xs font-bold text-slate-300 mb-2">Resultado de la migración:</p>
          {resultado.map((msg, i) => {
            const { icono: Icono, color, texto } = parsearMensaje(msg);
            return (
              <div key={i} className="flex items-center gap-2 text-xs">
                <Icono size={14} className={`${color} shrink-0`} />
                <span className="text-slate-300">{texto}</span>
              </div>
            );
          })}
        </div>
      )}

      <p className="text-slate-500 text-[10px]">
        Este botón sube los datos guardados en tu navegador a Firebase Cloud. 
        Una vez migrados, todos los cambios se sincronizan automáticamente.
      </p>
    </div>
  );
}
