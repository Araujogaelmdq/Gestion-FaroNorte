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
      {/* Saludo con animación */}
      <div className="animate-fade-in-down">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">
            ¡Hola, {user?.nombre?.split(' ')[0]}! <span className="inline-block animate-float">👋</span>
          </h1>
        </div>
        <p className="text-xs text-gray-500 font-medium mt-0.5">Así está el club hoy, {fechaHoy}.</p>
      </div>

      {/* Alerta cuotas faltantes */}
      {data && data.cuotasFaltantesGenerar > 0 && (
        <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-3.5 flex items-center justify-between shadow-sm animate-fade-in-up">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse-glow shrink-0" />
            <span className="text-xs text-amber-900 font-medium leading-relaxed">
              Faltan generar <strong>{data.cuotasFaltantesGenerar}</strong> cuotas de {nombreMes(data.mesActual)}
            </span>
          </div>
          <Link
            to="/cuotas"
            className="text-xs font-bold text-amber-700 hover:text-amber-800 bg-amber-100 hover:bg-amber-200 px-3 py-1.5 rounded-xl transition-all active:scale-95 shrink-0 ml-2 shadow-xs"
          >
            Generar →
          </Link>
        </div>
      )}

      {/* Accesos rápidos dinámicos */}
      <div className="grid grid-cols-3 gap-2.5 animate-fade-in-up">
        <Link
          to="/cobros"
          className="bg-white border border-gray-200/80 rounded-2xl p-3 text-center card-interactive flex flex-col items-center gap-1.5 shadow-xs"
        >
          <span className="w-9 h-9 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center text-lg font-bold">
            💳
          </span>
          <span className="text-xs font-bold text-gray-800">Cobrar</span>
        </Link>
        <Link
          to="/socios"
          className="bg-white border border-gray-200/80 rounded-2xl p-3 text-center card-interactive flex flex-col items-center gap-1.5 shadow-xs"
        >
          <span className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-lg font-bold">
            👥
          </span>
          <span className="text-xs font-bold text-gray-800">Socios</span>
        </Link>
        <Link
          to="/tesoreria"
          className="bg-white border border-gray-200/80 rounded-2xl p-3 text-center card-interactive flex flex-col items-center gap-1.5 shadow-xs"
        >
          <span className="w-9 h-9 rounded-xl bg-green-50 text-green-600 flex items-center justify-center text-lg font-bold">
            💰
          </span>
          <span className="text-xs font-bold text-gray-800">Tesorería</span>
        </Link>
      </div>

      {/* Tarjetas de estadísticas con efecto hover y colores vivos */}
      {data && (
        <div className="grid grid-cols-2 gap-3">
          <Card interactive className="p-3.5 border-t-4 border-t-blue-500 animate-fade-in-up stagger-1">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Socios activos</p>
            <p className="text-2xl font-black text-gray-900 mt-0.5 tracking-tight">{data.sociosActivos}</p>
            <p className="text-[11px] text-gray-400 mt-1 font-medium">{data.familiasCount} familia(s)</p>
          </Card>

          <Card interactive className="p-3.5 border-t-4 border-t-emerald-500 animate-fade-in-up stagger-2">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Cobrado este mes</p>
            <p className="text-xl font-black text-emerald-600 mt-0.5 tracking-tight">{formatearMoneda(data.cobradoMes.monto)}</p>
            <p className="text-[11px] text-gray-400 mt-1 font-medium">{data.cobradoMes.cuotas} recibo(s)</p>
          </Card>

          <Card interactive className="p-3.5 border-t-4 border-t-rose-500 animate-fade-in-up stagger-3">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Deuda vencida</p>
            <p className={`text-xl font-black mt-0.5 tracking-tight ${data.deudaVencida.monto > 0 ? 'text-rose-600' : 'text-gray-900'}`}>
              {formatearMoneda(data.deudaVencida.monto)}
            </p>
            <p className="text-[11px] text-gray-400 mt-1 font-medium">{data.deudaVencida.familias} familia(s)</p>
          </Card>

          <Card interactive className="p-3.5 border-t-4 border-t-orange-500 animate-fade-in-up stagger-4">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Plata en cuentas</p>
            <p className={`text-xl font-black mt-0.5 tracking-tight ${data.plataEnCuentas < 0 ? 'text-rose-600' : 'text-gray-900'}`}>
              {formatearMoneda(data.plataEnCuentas)}
            </p>
            <p className="text-[11px] text-gray-400 mt-1 font-medium">Gastos: {formatearMoneda(data.gastosMes)}</p>
          </Card>
        </div>
      )}

      {/* Aptos vencidos */}
      {data && data.aptosVencidos > 0 && (
        <Card interactive className="p-3.5 flex items-center justify-between border-l-4 border-l-amber-500 animate-fade-in-up">
          <div className="flex items-center gap-3">
            <span className="text-xl">🩺</span>
            <div>
              <p className="text-xs font-bold text-gray-900">Aptos médicos por vencer</p>
              <p className="text-[11px] text-gray-500">{data.aptosVencidos} socio(s) con apto vencido</p>
            </div>
          </div>
          <Link to="/socios?estado_apto=vencido" className="text-xs font-bold text-orange-600 hover:text-orange-700 bg-orange-50 px-3 py-1.5 rounded-xl">
            Ver →
          </Link>
        </Card>
      )}

      {/* Primeros pasos con barra de progreso animada */}
      {!todosListos && data && (
        <Card className="p-4 space-y-3 animate-fade-in-up">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-gray-900">Primeros pasos de configuración</h2>
            <span className="text-xs font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">
              {pasosDone} de 4
            </span>
          </div>

          {/* Barra de progreso animada */}
          <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-orange-400 to-orange-500 h-full rounded-full transition-all duration-700 ease-out"
              style={{ width: `${(pasosDone / 4) * 100}%` }}
            />
          </div>

          <div className="space-y-2 pt-1">
            {[
              { key: 'datosClub', label: 'Configurá los datos del club', link: '/configuracion' },
              { key: 'valorCuota', label: 'Definí el valor de las cuotas', link: '/configuracion' },
              { key: 'sociosCargados', label: 'Cargá los socios', link: '/socios' },
              { key: 'equipo', label: 'Invitá a tu equipo', link: '/configuracion' },
            ].map((paso) => {
              const completado = Boolean((data.primerosPasos as any)[paso.key]);
              return (
                <div key={paso.key} className="flex items-center gap-2.5">
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${completado ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-400'}`}>
                    {completado ? '✓' : '○'}
                  </span>
                  <Link
                    to={paso.link}
                    className={`text-xs font-medium transition-colors ${completado ? 'line-through text-gray-400' : 'text-orange-600 hover:text-orange-700'}`}
                  >
                    {paso.label}
                  </Link>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* PWA install banner */}
      <Card className="p-4 border border-dashed border-gray-300/80 bg-gradient-to-r from-orange-50/40 via-white to-blue-50/40 animate-fade-in-up">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-orange-500/10 text-orange-600 flex items-center justify-center text-xl shrink-0">
            📱
          </div>
          <div>
            <h2 className="text-xs font-bold text-gray-900">Instalá la aplicación en tu celular</h2>
            <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">
              En Chrome/Edge tocá los 3 puntos → "Instalar". En iPhone tocá Compartir → "Agregar al inicio".
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
