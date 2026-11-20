import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { cuotasService } from '../services/modulos';
import { formatearMoneda } from '@faronorte/shared';
import { Card } from '../components/Card';
import { Button } from '../components/Button';

const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

function periodoActual() {
  const hoy = new Date();
  return `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}`;
}

function nombreMes(periodo: string) {
  const [a, m] = periodo.split('-');
  return `${MESES[parseInt(m) - 1]} ${a}`;
}

export function Cuotas() {
  const [periodo, setPeriodo] = useState(periodoActual());
  const [estado, setEstado] = useState<any>(null);
  const [deudas, setDeudas] = useState<any[]>([]);
  const [loadingEstado, setLoadingEstado] = useState(false);
  const [generando, setGenerando] = useState(false);
  const [busqDeuda, setBusqDeuda] = useState('');

  const cargarEstado = useCallback(async () => {
    setLoadingEstado(true);
    try {
      const res = await cuotasService.estado(periodo);
      setEstado(res);
    } catch (e) {
      setEstado(null);
    } finally {
      setLoadingEstado(false);
    }
  }, [periodo]);

  useEffect(() => {
    cargarEstado();
    cuotasService.deudas().then((r) => setDeudas(r.deudas));
  }, [cargarEstado]);

  async function generar() {
    if (!confirm(`¿Generar cuotas para ${nombreMes(periodo)}?`)) return;
    setGenerando(true);
    try {
      await cuotasService.generar(periodo);
      await cargarEstado();
    } catch (e: any) {
      alert(e.message || 'Error al generar');
    } finally {
      setGenerando(false);
    }
  }

  // Mes anterior / siguiente
  function cambiarMes(delta: number) {
    const [a, m] = periodo.split('-').map(Number);
    const d = new Date(a, m - 1 + delta, 1);
    setPeriodo(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  }

  const deudasFiltradas = deudas.filter(
    (d) =>
      !busqDeuda ||
      (d.familia_nombre || '').toLowerCase().includes(busqDeuda.toLowerCase()) ||
      (d.responsable_nombre || '').toLowerCase().includes(busqDeuda.toLowerCase()),
  );

  return (
    <div className="p-4 space-y-4 max-w-lg mx-auto pb-24">
      <h1 className="text-xl font-bold">Cuotas</h1>

      {/* Selector de mes */}
      <div className="flex items-center gap-3 justify-center">
        <button onClick={() => cambiarMes(-1)} className="p-2 rounded-full hover:bg-gray-100 text-gray-600 text-lg">‹</button>
        <span className="font-semibold text-gray-900 min-w-[160px] text-center">{nombreMes(periodo)}</span>
        <button onClick={() => cambiarMes(1)} className="p-2 rounded-full hover:bg-gray-100 text-gray-600 text-lg">›</button>
      </div>

      {/* Generar cuotas */}
      {estado && estado.sinCuota > 0 && (
        <Card className="p-4 border-l-4 border-l-yellow-400">
          <h2 className="font-bold text-gray-900 mb-1">Generar cuotas de {nombreMes(periodo)}</h2>
          <p className="text-sm text-gray-600 mb-2">
            {estado.sinCuota} socio(s) sin cuota · Vencimiento: {estado.fechaVencimiento}
          </p>
          <p className="text-xs text-gray-400 mb-3">Si ya generaste algunas, esta acción solo genera las que faltan.</p>
          <Button onClick={generar} disabled={generando}>
            {generando ? 'Generando…' : `Generar ${estado.sinCuota} cuota(s)`}
          </Button>
        </Card>
      )}

      {/* Tarjetas de resumen */}
      {loadingEstado ? (
        <p className="text-center text-gray-400 py-4">Cargando…</p>
      ) : estado ? (
        <div className="grid grid-cols-2 gap-3">
          <Card className="p-3">
            <p className="text-xs text-gray-500 uppercase">Emitido</p>
            <p className="text-lg font-bold text-gray-900">{formatearMoneda(estado.emitidoMonto)}</p>
            <p className="text-xs text-gray-400">{estado.emitidas} cuota(s)</p>
          </Card>
          <Card className="p-3">
            <p className="text-xs text-gray-500 uppercase">Cobrado</p>
            <p className="text-lg font-bold text-green-600">{formatearMoneda(estado.cobradoMonto)}</p>
            <p className="text-xs text-gray-400">{estado.cobradas} cuota(s)</p>
          </Card>
          <Card className="p-3">
            <p className="text-xs text-gray-500 uppercase">Falta cobrar</p>
            <p className={`text-lg font-bold ${estado.faltaCobrar > 0 ? 'text-orange-500' : 'text-gray-900'}`}>
              {formatearMoneda(estado.emitidoMonto - estado.cobradoMonto)}
            </p>
            <p className="text-xs text-gray-400">{estado.faltaCobrar} cuota(s)</p>
          </Card>
          <Card className="p-3">
            <p className="text-xs text-gray-500 uppercase">Cobrabilidad</p>
            <p className="text-lg font-bold text-blue-600">{estado.cobrabilidad}%</p>
            <div className="mt-1 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full"
                style={{ width: `${estado.cobrabilidad}%` }}
              />
            </div>
          </Card>
        </div>
      ) : null}

      {/* Familias que deben */}
      <div>
        <h2 className="font-semibold text-gray-800 mb-2">Familias que deben</h2>
        <input
          type="text"
          placeholder="Buscar familia…"
          value={busqDeuda}
          onChange={(e) => setBusqDeuda(e.target.value)}
          className="w-full border rounded-lg px-3 py-2 text-sm mb-3"
        />
        {deudasFiltradas.length === 0 ? (
          <Card className="p-4 text-center text-gray-400 text-sm">
            {deudas.length === 0 ? '🎉 No hay familias con cuotas vencidas.' : 'No hay resultados.'}
          </Card>
        ) : (
          <div className="space-y-2">
            {deudasFiltradas.map((d, i) => (
              <Card key={i} className="p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{d.familia_nombre}</p>
                    <p className="text-xs text-gray-500">
                      {d.cantidad_cuotas} cuota(s) · debe desde {d.debe_desde}
                    </p>
                    <p className="text-sm font-bold text-red-600">{formatearMoneda(d.monto)}</p>
                  </div>
                  <div className="flex flex-col gap-1">
                    {d.responsable_telefono ? (
                      <a
                        href={`https://wa.me/549${d.responsable_telefono.replace(/\D/g, '')}?text=${encodeURIComponent(`Hola! Desde Faro Norte, te recordamos que tenés ${d.cantidad_cuotas} cuota(s) vencida(s) por ${formatearMoneda(d.monto)}.`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs bg-green-100 text-green-700 rounded-lg px-2 py-1 font-medium"
                      >
                        Recordar 💬
                      </a>
                    ) : (
                      <button
                        onClick={() => alert('Este responsable no tiene teléfono cargado.')}
                        className="text-xs bg-gray-100 text-gray-500 rounded-lg px-2 py-1"
                      >
                        Sin tel.
                      </button>
                    )}
                    <Link
                      to={`/cobros?familia=${d.familia_id}`}
                      className="text-xs bg-blue-100 text-blue-700 rounded-lg px-2 py-1 font-medium text-center"
                    >
                      Cobrar
                    </Link>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
