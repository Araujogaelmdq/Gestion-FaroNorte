import { useEffect, useState, useCallback } from 'react';
import { reportesService } from '../services/modulos';
import { formatearMoneda } from '@faronorte/shared';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Tabs } from '../components/Tabs';

function mesActual() {
  const hoy = new Date();
  return `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}`;
}

function haceSeisMeses() {
  const hoy = new Date();
  hoy.setMonth(hoy.getMonth() - 6);
  return `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}`;
}

export function Reportes() {
  const [tab, setTab] = useState('ig');
  const [desde, setDesde] = useState(`${haceSeisMeses()}-01`);
  const [hasta, setHasta] = useState(`${mesActual()}-28`);
  const [igData, setIgData] = useState<any>(null);
  const [cobranzaData, setCobranzaData] = useState<any>(null);
  const [morososData, setMorososData] = useState<any[]>([]);
  const [sociosData, setSociosData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const [ig, cob, mor, soc] = await Promise.all([
        reportesService.ingresosGastos(desde, hasta),
        reportesService.cobranza(),
        reportesService.morosos(),
        reportesService.socios(),
      ]);
      setIgData(ig);
      setCobranzaData(cob);
      setMorososData(mor.morosos || []);
      setSociosData(soc);
    } finally {
      setLoading(false);
    }
  }, [desde, hasta]);

  useEffect(() => { cargar(); }, [cargar]);

  return (
    <div className="p-4 space-y-4 max-w-lg mx-auto pb-24">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Reportes</h1>
        <a href={reportesService.exportarUrl('todos', desde, hasta)} target="_blank" rel="noopener noreferrer">
          <Button variant="secondary" className="text-sm">📊 Excel</Button>
        </a>
      </div>

      <div className="flex gap-2">
        <div className="flex-1">
          <label className="text-xs text-gray-500">Desde</label>
          <input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} className="w-full border rounded-lg px-2 py-1.5 text-sm" />
        </div>
        <div className="flex-1">
          <label className="text-xs text-gray-500">Hasta</label>
          <input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} className="w-full border rounded-lg px-2 py-1.5 text-sm" />
        </div>
        <div className="flex items-end"><Button onClick={cargar} className="text-sm">Ver</Button></div>
      </div>

      <Tabs
        tabs={[
          { id: 'ig', label: 'Ingresos y gastos' },
          { id: 'cobranza', label: 'Cobranza' },
          { id: 'morosos', label: 'Morosos' },
          { id: 'socios', label: 'Socios' },
        ]}
        activeTab={tab}
        onChange={setTab}
      />

      {loading && <p className="text-center text-gray-400 py-4">Cargando…</p>}

      {/* Tab Ingresos y gastos */}
      {!loading && tab === 'ig' && igData && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Card className="p-3">
              <p className="text-xs text-gray-500">Ingresos</p>
              <p className="text-lg font-bold text-green-600">{formatearMoneda(igData.totalIngresos)}</p>
            </Card>
            <Card className="p-3">
              <p className="text-xs text-gray-500">Gastos</p>
              <p className="text-lg font-bold text-red-600">{formatearMoneda(igData.totalGastos)}</p>
            </Card>
            <Card className="p-3">
              <p className="text-xs text-gray-500">Superávit</p>
              <p className={`text-lg font-bold ${igData.superavit >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                {formatearMoneda(igData.superavit)}
              </p>
            </Card>
            <Card className="p-3">
              <p className="text-xs text-gray-500">Plata en cuentas</p>
              <p className={`text-lg font-bold ${igData.plataEnCuentas >= 0 ? 'text-gray-900' : 'text-red-600'}`}>
                {formatearMoneda(igData.plataEnCuentas)}
              </p>
            </Card>
          </div>

          {/* Serie mensual — tabla simple sin Recharts por ahora */}
          <Card className="p-3">
            <h3 className="font-semibold text-sm mb-2">Mes a mes</h3>
            <div className="overflow-x-auto">
              <table className="text-xs w-full">
                <thead>
                  <tr className="text-gray-500 border-b">
                    <th className="text-left pb-1">Mes</th>
                    <th className="text-right pb-1 text-green-600">Ingresos</th>
                    <th className="text-right pb-1 text-red-600">Gastos</th>
                  </tr>
                </thead>
                <tbody>
                  {(igData.serieMensual || []).map((s: any) => (
                    <tr key={s.mes} className="border-b border-gray-100">
                      <td className="py-0.5">{s.label}</td>
                      <td className="text-right text-green-600">{formatearMoneda(s.ingresos)}</td>
                      <td className="text-right text-red-600">{formatearMoneda(s.gastos)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <div className="grid grid-cols-2 gap-3">
            <Card className="p-3">
              <h3 className="font-semibold text-sm mb-2">Ingresos por rubro</h3>
              {igData.ingresos.map((r: any, i: number) => (
                <div key={i} className="flex justify-between text-xs py-0.5">
                  <span className="truncate text-gray-700">{r.nombre}</span>
                  <span className="font-semibold text-green-600 ml-2">{formatearMoneda(r.monto)}</span>
                </div>
              ))}
            </Card>
            <Card className="p-3">
              <h3 className="font-semibold text-sm mb-2">Gastos por rubro</h3>
              {igData.gastos.map((r: any, i: number) => (
                <div key={i} className="flex justify-between text-xs py-0.5">
                  <span className="truncate text-gray-700">{r.nombre}</span>
                  <span className="font-semibold text-red-600 ml-2">{formatearMoneda(r.monto)}</span>
                </div>
              ))}
            </Card>
          </div>
          <p className="text-xs text-gray-400">Los movimientos anulados y las transferencias no están incluidos.</p>
        </div>
      )}

      {/* Tab Cobranza */}
      {!loading && tab === 'cobranza' && cobranzaData && (
        <div className="space-y-3">
          <Card className="p-3">
            <h3 className="font-semibold text-sm mb-2">Cobranza por mes</h3>
            <div className="overflow-x-auto">
              <table className="text-xs w-full">
                <thead>
                  <tr className="text-gray-500 border-b">
                    <th className="text-left pb-1">Mes</th>
                    <th className="text-right pb-1">Emitido</th>
                    <th className="text-right pb-1">Cobrado</th>
                    <th className="text-right pb-1">%</th>
                  </tr>
                </thead>
                <tbody>
                  {(cobranzaData.meses || []).map((m: any) => (
                    <tr key={m.mes} className="border-b border-gray-100">
                      <td className="py-0.5">{m.mes}</td>
                      <td className="text-right">{formatearMoneda(m.emitido)}</td>
                      <td className="text-right text-green-600">{formatearMoneda(m.cobrado)}</td>
                      <td className="text-right font-semibold">{m.pct}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* Tab Morosos */}
      {!loading && tab === 'morosos' && (
        <div className="space-y-2">
          {morososData.length === 0 ? (
            <Card className="p-6 text-center text-gray-400">🎉 No hay morosos.</Card>
          ) : morososData.map((m: any, i: number) => (
            <Card key={i} className="p-3">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold text-sm">{m.nombre}</p>
                  <p className="text-xs text-gray-500">{m.cantidad} cuota(s) · desde {m.masAntigua}</p>
                </div>
                <p className="font-bold text-red-600">{formatearMoneda(m.monto)}</p>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Tab Socios */}
      {!loading && tab === 'socios' && sociosData && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Total socios', value: sociosData.total },
              { label: 'Activos', value: sociosData.activos },
              { label: 'Bajas', value: sociosData.bajas },
              { label: 'Vitalicios', value: sociosData.vitalicos },
              { label: 'Aptos vigentes', value: sociosData.aptosVigentes },
              { label: 'Aptos vencidos', value: sociosData.aptosVencidos },
              { label: 'Sin apto', value: sociosData.sinApto },
              { label: 'Altas este mes', value: sociosData.altas },
            ].map((item) => (
              <Card key={item.label} className="p-3 text-center">
                <p className="text-xs text-gray-500">{item.label}</p>
                <p className="text-2xl font-bold text-gray-900">{item.value}</p>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
