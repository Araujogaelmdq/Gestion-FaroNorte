import { useEffect, useState } from 'react';
import { transparenciaService } from '../services/modulos';
import { formatearMoneda } from '@faronorte/shared';

export function TransparenciaPublica() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    transparenciaService.publica().then(setData).catch(() => setData(null)).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <p className="text-gray-400">Cargando…</p>
    </div>
  );

  if (!data || !data.publicada) return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
      <div className="text-6xl mb-4">🔒</div>
      <h1 className="text-xl font-bold text-gray-900 mb-2">{data?.nombre_club || 'Club'}</h1>
      <p className="text-gray-500">{data?.mensaje || 'La información pública no está disponible.'}</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-lg mx-auto p-4 space-y-6 pb-12">
        {/* Header */}
        <div className="text-center pt-6 space-y-2">
          {data.escudo_url && (
            <img src={data.escudo_url} alt={data.nombre_club} className="w-20 h-20 object-contain mx-auto rounded-full" />
          )}
          <h1 className="text-2xl font-bold text-gray-900">{data.nombre_club}</h1>
          <p className="text-sm text-gray-500">Información de transparencia</p>
        </div>

        {/* Mensaje */}
        {data.mensaje && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <p className="text-sm text-blue-800">{data.mensaje}</p>
          </div>
        )}

        {/* Estadísticas */}
        {(data.cantidad_socios != null || data.pct_cobrado != null || data.plata_en_cuentas != null) && (
          <div className="grid grid-cols-2 gap-3">
            {data.cantidad_socios != null && (
              <div className="bg-white rounded-xl p-4 shadow-sm text-center">
                <p className="text-xs text-gray-500 uppercase tracking-wide">Socios activos</p>
                <p className="text-3xl font-bold text-gray-900">{data.cantidad_socios}</p>
                {data.cantidad_familias != null && <p className="text-xs text-gray-400">{data.cantidad_familias} familias</p>}
              </div>
            )}
            {data.pct_cobrado != null && (
              <div className="bg-white rounded-xl p-4 shadow-sm text-center">
                <p className="text-xs text-gray-500 uppercase tracking-wide">Cobranza</p>
                <p className="text-3xl font-bold text-green-600">{data.pct_cobrado}%</p>
                <p className="text-xs text-gray-400">de cuotas cobradas</p>
              </div>
            )}
            {data.plata_en_cuentas != null && (
              <div className="bg-white rounded-xl p-4 shadow-sm text-center col-span-2">
                <p className="text-xs text-gray-500 uppercase tracking-wide">Fondos disponibles</p>
                <p className={`text-2xl font-bold ${data.plata_en_cuentas >= 0 ? 'text-gray-900' : 'text-red-600'}`}>
                  {formatearMoneda(data.plata_en_cuentas)}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Ingresos y gastos */}
        {(data.ingresos_por_rubro?.length > 0 || data.gastos_por_rubro?.length > 0) && (
          <div className="grid grid-cols-2 gap-3">
            {data.ingresos_por_rubro?.length > 0 && (
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <h2 className="font-semibold text-sm text-gray-900 mb-2">Ingresos</h2>
                {data.ingresos_por_rubro.map((r: any, i: number) => (
                  <div key={i} className="flex justify-between text-xs py-0.5">
                    <span className="text-gray-600 truncate">{r.nombre}</span>
                    <span className="font-semibold text-green-600 ml-1">{formatearMoneda(r.monto)}</span>
                  </div>
                ))}
              </div>
            )}
            {data.gastos_por_rubro?.length > 0 && (
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <h2 className="font-semibold text-sm text-gray-900 mb-2">Gastos</h2>
                {data.gastos_por_rubro.map((r: any, i: number) => (
                  <div key={i} className="flex justify-between text-xs py-0.5">
                    <span className="text-gray-600 truncate">{r.nombre}</span>
                    <span className="font-semibold text-red-600 ml-1">{formatearMoneda(r.monto)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Detalle de gastos */}
        {data.detalle_gastos?.length > 0 && (
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <h2 className="font-semibold text-gray-900 mb-3">Detalle de gastos</h2>
            <div className="space-y-2">
              {data.detalle_gastos.map((g: any, i: number) => (
                <div key={i} className="flex items-start justify-between text-sm border-b border-gray-100 pb-2 last:border-0 last:pb-0">
                  <div>
                    <p className="font-medium text-gray-800">{g.rubro}</p>
                    {g.detalle && <p className="text-xs text-gray-500">{g.detalle}</p>}
                    <p className="text-xs text-gray-400">{g.fecha}</p>
                  </div>
                  <p className="font-semibold text-red-600 ml-4">{formatearMoneda(g.importe)}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="text-center text-xs text-gray-400 pt-4">
          Este sistema es propiedad de {data.nombre_club}. Los datos se actualizan en tiempo real.
        </div>
      </div>
    </div>
  );
}

