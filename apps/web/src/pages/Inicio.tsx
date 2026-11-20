import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { inicioService } from '../services/modulos';
import { formatearMoneda, formatearFecha } from '@faronorte/shared';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';

interface DashboardData {
  sociosActivos: number;
  familiasCount: number;
  cobradoMes: { monto: number; cuotas: number };
  deudaVencida: { monto: number; familias: number };
  plataEnCuentas: number;
  gastosMes: number;
  aptosVencidos: number;
  cuotasFaltantesGenerar: number;
  mesActual: string;
  primerosPasos: { datosClub: boolean; valorCuota: boolean; sociosCargados: boolean; equipo: boolean };
}

const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

function nombreMes(periodo: string) {
  const [a, m] = periodo.split('-');
  return `${MESES[parseInt(m) - 1]} ${a}`;
}

export function Inicio() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const hoy = new Date();
  const fechaHoy = `${String(hoy.getDate()).padStart(2,'0')}/${String(hoy.getMonth()+1).padStart(2,'0')}/${hoy.getFullYear()}`;

  useEffect(() => {
    inicioService.dashboard().then(setData).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="p-4 text-center text-gray-500">Cargando…</div>
  );

  const pasosDone = data ? Object.values(data.primerosPasos).filter(Boolean).length : 0;
  const todosListos = pasosDone === 4;

  return (
    <div className="p-4 space-y-4 max-w-lg mx-auto pb-24">
      <div>
        <h1 className="text-xl font-bold text-gray-900">¡Hola, {user?.nombre?.split(' ')[0]}!</h1>
        <p className="text-sm text-gray-500">Así está el club hoy, {fechaHoy}.</p>
      </div>

      {/* Alerta cuotas faltantes */}
      {data && data.cuotasFaltantesGenerar > 0 && (
        <div className="bg-yellow-50 border border-yellow-300 rounded-xl p-3 flex items-center justify-between">
          <span className="text-sm text-yellow-800">
            ⚠️ Faltan generar <strong>{data.cuotasFaltantesGenerar}</strong> cuota(s) de {nombreMes(data.mesActual)}
          </span>
          <Link to="/cuotas" className="text-sm font-semibold text-yellow-700 ml-2 whitespace-nowrap">Generarlas →</Link>
        </div>
      )}

      {/* Tarjetas de estadísticas */}
      {data && (
        <div className="grid grid-cols-2 gap-3">
          <Card className="p-3">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Socios activos</p>
            <p className="text-2xl font-bold text-gray-900">{data.sociosActivos}</p>
            <p className="text-xs text-gray-400">{data.familiasCount} familia(s)</p>
          </Card>

          <Card className="p-3">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Cobrado este mes</p>
            <p className="text-xl font-bold text-green-600">{formatearMoneda(data.cobradoMes.monto)}</p>
            <p className="text-xs text-gray-400">{data.cobradoMes.cuotas} recibo(s)</p>
          </Card>

          <Card className="p-3">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Deuda vencida</p>
            <p className={`text-xl font-bold ${data.deudaVencida.monto > 0 ? 'text-red-600' : 'text-gray-900'}`}>
              {formatearMoneda(data.deudaVencida.monto)}
            </p>
            <p className="text-xs text-gray-400">{data.deudaVencida.familias} familia(s)</p>
          </Card>

          <Card className="p-3">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Plata en cuentas</p>
            <p className={`text-xl font-bold ${data.plataEnCuentas < 0 ? 'text-red-600' : 'text-gray-900'}`}>
              {formatearMoneda(data.plataEnCuentas)}
            </p>
            <p className="text-xs text-gray-400">Gastos mes: {formatearMoneda(data.gastosMes)}</p>
          </Card>
        </div>
      )}

      {/* Aptos vencidos */}
      {data && data.aptosVencidos > 0 && (
        <Card className="p-3 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-orange-700">🩺 Aptos médicos vencidos</p>
            <p className="text-xs text-gray-500">{data.aptosVencidos} socio(s) con apto vencido</p>
          </div>
          <Link to="/socios?estado_apto=vencido" className="text-sm text-orange-600 font-semibold">Ver →</Link>
        </Card>
      )}

      {/* Primeros pasos */}
      {!todosListos && data && (
        <Card className="p-4 space-y-3">
          <h2 className="font-bold text-gray-900">Primeros pasos</h2>
          <div className="space-y-2">
            {[
              { key: 'datosClub', label: 'Configurá los datos del club', link: '/configuracion' },
              { key: 'valorCuota', label: 'Definí el valor de las cuotas', link: '/configuracion' },
              { key: 'sociosCargados', label: 'Cargá los socios', link: '/socios' },
              { key: 'equipo', label: 'Invitá a tu equipo', link: '/configuracion' },
            ].map((paso) => (
              <div key={paso.key} className="flex items-center gap-2">
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${(data.primerosPasos as any)[paso.key] ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
                  {(data.primerosPasos as any)[paso.key] ? '✓' : '○'}
                </span>
                <Link to={paso.link} className={`text-sm ${(data.primerosPasos as any)[paso.key] ? 'line-through text-gray-400' : 'text-blue-600'}`}>
                  {paso.label}
                </Link>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* PWA install */}
      <Card className="p-4">
        <h2 className="font-bold text-gray-900 mb-1">📱 Instalá el sistema en tu celular</h2>
        <p className="text-sm text-gray-500">En Chrome/Edge: Menú → "Instalar aplicación". En Safari: Compartir → "Agregar a inicio".</p>
      </Card>
    </div>
  );
}
