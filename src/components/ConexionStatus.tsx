import { Wifi, WifiOff, RefreshCw, Cloud, HardDrive } from 'lucide-react';
import { useApiStatus } from '../hooks/useApiStatus';

export default function ConexionStatus() {
  const { disponible, verificando, verificar } = useApiStatus();

  if (disponible === null || verificando) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-700/50 rounded-lg text-xs text-slate-400">
        <RefreshCw size={12} className="animate-spin" />
        <span>Verificando conexión...</span>
      </div>
    );
  }

  if (disponible) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border border-green-500/30 rounded-lg text-xs text-green-400">
        <Cloud size={12} />
        <span>Conectado a la nube</span>
        <button onClick={verificar} className="hover:text-green-300" title="Verificar">
          <RefreshCw size={10} />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 border border-amber-500/30 rounded-lg text-xs text-amber-400">
      <WifiOff size={12} />
      <span>Modo local (sin servidor)</span>
      <button onClick={verificar} className="hover:text-amber-300" title="Reintentar conexión">
        <RefreshCw size={10} />
      </button>
    </div>
  );
}
