import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { cobrosService } from '../services/modulos';
import { formatearMoneda, formatearFecha } from '@faronorte/shared';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Modal } from '../components/Modal';
import { Badge } from '../components/Badge';
import { getCuentas } from '../services/configuracion';

const MEDIOS_PAGO = [
  { value: 'efectivo', label: 'Efectivo' },
  { value: 'transferencia', label: 'Transferencia' },
  { value: 'debito', label: 'Débito' },
  { value: 'tarjeta', label: 'Tarjeta' },
  { value: 'otro', label: 'Otro' },
];

const MESES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

function periodoLabel(periodo: string) {
  const [a, m] = periodo.split('-');
  return `${MESES[parseInt(m) - 1]} ${a}`;
}

export function Cobros() {
  const [searchParams] = useSearchParams();
  const [busqueda, setBusqueda] = useState('');
  const [resultados, setResultados] = useState<any[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [familiaSeleccionada, setFamiliaSeleccionada] = useState<any>(null);
  const [cuotasPendientes, setCuotasPendientes] = useState<any[]>([]);
  const [cuotasSeleccionadas, setCuotasSeleccionadas] = useState<Set<number>>(new Set());
  const [medioPago, setMedioPago] = useState('efectivo');
  const [cuentaId, setCuentaId] = useState('');
  const [cuentas, setCuentas] = useState<any[]>([]);
  const [cobrando, setCobrando] = useState(false);
  const [recibosLista, setRecibosLista] = useState<any[]>([]);
  const [desdeR, setDesdeR] = useState('');
  const [hastaR, setHastaR] = useState('');
  const [showAnularModal, setShowAnularModal] = useState(false);
  const [reciboAnularId, setReciboAnularId] = useState<number | null>(null);
  const [motivoAnulacion, setMotivoAnulacion] = useState('');
  const [anulando, setAnulando] = useState(false);
  const [paso, setPaso] = useState<'buscar' | 'cuotas' | 'pago' | 'exito'>('buscar');
  const [reciboExito, setReciboExito] = useState<any>(null);

  useEffect(() => {
    getCuentas().then(setCuentas);
    cargarRecibos();
    // Si viene parámetro familia desde /cuotas
    const familiaParam = searchParams.get('familia');
    if (familiaParam) {
      // Intentar cargar cuotas directamente
      seleccionarFamilia({ familia_id: parseInt(familiaParam), familia_nombre: `Familia #${familiaParam}`, socios: [] });
    }
  }, []);

  async function buscar() {
    if (busqueda.length < 2) return;
    setBuscando(true);
    try {
      const res = await cobrosService.buscar(busqueda);
      setResultados(res.resultados);
    } finally {
      setBuscando(false);
    }
  }

  async function seleccionarFamilia(fam: any) {
    setFamiliaSeleccionada(fam);
    setResultados([]);
    const res = await cobrosService.cuotasPendientes(fam.familia_id);
    setCuotasPendientes(res.cuotas);
    setCuotasSeleccionadas(new Set(res.cuotas.map((c: any) => c.id)));
    setPaso('cuotas');
  }

  function toggleCuota(id: number) {
    setCuotasSeleccionadas((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const totalSeleccionado = cuotasPendientes
    .filter((c) => cuotasSeleccionadas.has(c.id))
    .reduce((acc, c) => acc + c.importe, 0);

  async function confirmarCobro() {
    if (!cuentaId) { alert('Seleccioná una cuenta'); return; }
    setCobrando(true);
    try {
      const res = await cobrosService.cobrar({
        familia_id: familiaSeleccionada?.familia_id || null,
        cuota_ids: Array.from(cuotasSeleccionadas),
        importe: totalSeleccionado,
        medio_pago: medioPago,
        cuenta_id: parseInt(cuentaId),
      });
      setReciboExito(res.recibo);
      setPaso('exito');
      cargarRecibos();
    } catch (e: any) {
      alert(e.message || 'Error al cobrar');
    } finally {
      setCobrando(false);
    }
  }

  async function cargarRecibos() {
    const res = await cobrosService.recibos(desdeR || undefined, hastaR || undefined);
    setRecibosLista(res.recibos);
  }

  async function anular() {
    if (!motivoAnulacion) { alert('El motivo es obligatorio'); return; }
    setAnulando(true);
    try {
      await cobrosService.anular(reciboAnularId!, motivoAnulacion);
      setShowAnularModal(false);
      setMotivoAnulacion('');
      cargarRecibos();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setAnulando(false);
    }
  }

  function resetear() {
    setPaso('buscar');
    setBusqueda('');
    setFamiliaSeleccionada(null);
    setCuotasPendientes([]);
    setCuotasSeleccionadas(new Set());
    setMedioPago('efectivo');
    setCuentaId('');
    setReciboExito(null);
  }

  return (
    <div className="p-4 space-y-4 max-w-lg mx-auto pb-24">
      <h1 className="text-xl font-bold">Cobros</h1>

      {/* Flujo de cobro */}
      <Card className="p-4 space-y-3">
        <h2 className="font-semibold text-gray-800">Cobrar a una familia</h2>

        {paso === 'buscar' && (
          <>
            <div className="flex gap-2">
              <Input
                placeholder="Nombre, apellido o DNI…"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && buscar()}
                className="flex-1"
              />
              <Button onClick={buscar} disabled={buscando}>Buscar</Button>
            </div>
            {resultados.length > 0 && (
              <div className="space-y-1">
                {resultados.map((r, i) => (
                  <button
                    key={i}
                    onClick={() => seleccionarFamilia(r)}
                    className="w-full text-left p-2 hover:bg-blue-50 rounded-lg border text-sm"
                  >
                    <span className="font-semibold">{r.familia_nombre}</span>
                    <span className="text-gray-400 ml-2 text-xs">{r.socios.length} socio(s)</span>
                  </button>
                ))}
              </div>
            )}
          </>
        )}

        {paso === 'cuotas' && (
          <>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold">{familiaSeleccionada?.familia_nombre}</p>
                <p className="text-xs text-gray-500">{cuotasPendientes.length} cuota(s) pendiente(s)</p>
              </div>
              <button onClick={() => setPaso('buscar')} className="text-sm text-gray-400">← Volver</button>
            </div>
            {cuotasPendientes.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">🎉 No hay cuotas pendientes.</p>
            ) : (
              <>
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {cuotasPendientes.map((c: any) => (
                    <label key={c.id} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
                      <input
                        type="checkbox"
                        checked={cuotasSeleccionadas.has(c.id)}
                        onChange={() => toggleCuota(c.id)}
                        className="rounded"
                      />
                      <span className="flex-1 text-sm">
                        {c.socio_apellido}, {c.socio_nombre} — {periodoLabel(c.periodo)}
                      </span>
                      <span className="text-sm font-semibold">{formatearMoneda(c.importe)}</span>
                    </label>
                  ))}
                </div>
                <div className="border-t pt-2 flex justify-between items-center">
                  <span className="font-bold">Total</span>
                  <span className="font-bold text-blue-700">{formatearMoneda(totalSeleccionado)}</span>
                </div>
                <Button onClick={() => setPaso('pago')} disabled={cuotasSeleccionadas.size === 0}>
                  Continuar al pago →
                </Button>
              </>
            )}
          </>
        )}

        {paso === 'pago' && (
          <>
            <div className="flex items-center justify-between">
              <p className="font-semibold">Confirmar cobro</p>
              <button onClick={() => setPaso('cuotas')} className="text-sm text-gray-400">← Volver</button>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-700">Medio de pago</label>
              <select
                value={medioPago}
                onChange={(e) => setMedioPago(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm mt-0.5"
              >
                {MEDIOS_PAGO.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-700">Cuenta destino</label>
              <select
                value={cuentaId}
                onChange={(e) => setCuentaId(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm mt-0.5"
              >
                <option value="">Seleccioná una cuenta</option>
                {cuentas.filter((c: any) => c.activa).map((c: any) => (
                  <option key={c.id} value={c.id}>{c.nombre}</option>
                ))}
              </select>
            </div>
            <div className="border-t pt-2 flex justify-between items-center">
              <span className="font-bold">Total a cobrar</span>
              <span className="font-bold text-blue-700 text-lg">{formatearMoneda(totalSeleccionado)}</span>
            </div>
            <Button onClick={confirmarCobro} disabled={cobrando}>
              {cobrando ? 'Procesando…' : 'Confirmar cobro'}
            </Button>
          </>
        )}

        {paso === 'exito' && reciboExito && (
          <div className="text-center space-y-3 py-4 animate-scale-in">
            <div className="text-5xl inline-block animate-float">🎉</div>
            <p className="text-lg font-black text-gray-900">¡Cobro registrado con éxito!</p>
            <p className="text-xs text-gray-500 font-medium">Recibo N° {String(reciboExito.numero).padStart(6,'0')} · {formatearMoneda(reciboExito.total)}</p>
            <div className="flex gap-2 justify-center pt-2">
              <a href={cobrosService.pdfUrl(reciboExito.id)} target="_blank" rel="noopener noreferrer">
                <Button variant="secondary" className="text-xs shadow-xs">📄 Descargar PDF</Button>
              </a>
              <Button onClick={resetear} className="text-xs shadow-md">Cobrar otro</Button>
            </div>
          </div>
        )}
      </Card>

      {/* Recibos emitidos */}
      <div className="animate-fade-in-up">
        <h2 className="font-bold text-gray-900 text-sm mb-2.5">Recibos emitidos</h2>
        <div className="flex gap-2 mb-3 flex-wrap">
          <div className="flex-1 min-w-[120px]">
            <label className="text-xs font-medium text-gray-500">Desde</label>
            <Input type="date" value={desdeR} onChange={(e) => setDesdeR(e.target.value)} />
          </div>
          <div className="flex-1 min-w-[120px]">
            <label className="text-xs font-medium text-gray-500">Hasta</label>
            <Input type="date" value={hastaR} onChange={(e) => setHastaR(e.target.value)} />
          </div>
          <div className="flex items-end">
            <Button onClick={cargarRecibos} variant="secondary" className="text-xs font-semibold">Ver</Button>
          </div>
        </div>
        {recibosLista.length === 0 ? (
          <Card className="p-6 text-center text-gray-400 text-xs">No hay recibos en ese rango.</Card>
        ) : (
          <div className="space-y-2">
            {recibosLista.map((r: any, idx: number) => (
              <Card
                key={r.id}
                interactive
                className={`p-3.5 card-interactive animate-fade-in-up ${r.anulado ? 'opacity-60 bg-gray-50/80' : ''}`}
                style={{ animationDelay: `${Math.min(idx * 30, 300)}ms` }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs text-gray-400">#{String(r.numero).padStart(6,'0')}</span>
                      <span className="font-semibold text-sm truncate">{r.familia_nombre || 'Sin familia'}</span>
                      {r.anulado && <Badge variant="danger" size="sm">ANULADO</Badge>}
                    </div>
                    <p className="text-xs text-gray-500">{r.fecha} · {r.medio_pago} · {r.usuario_nombre}</p>
                    <p className="font-bold text-gray-900">{formatearMoneda(r.total)}</p>
                  </div>
                  <div className="flex flex-col gap-1">
                    <a href={cobrosService.pdfUrl(r.id)} target="_blank" rel="noopener noreferrer" className="text-xs bg-gray-100 text-gray-700 rounded px-2 py-1">PDF</a>
                    {!r.anulado && (
                      <button
                        onClick={() => { setReciboAnularId(r.id); setShowAnularModal(true); }}
                        className="text-xs bg-red-100 text-red-700 rounded px-2 py-1"
                      >
                        Anular
                      </button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Modal anulación */}
      <Modal isOpen={showAnularModal} onClose={() => setShowAnularModal(false)} title="Anular recibo">
        <div className="space-y-3">
          <p className="text-sm text-gray-600">Las cuotas volverán a estado pendiente.</p>
          <div>
            <label className="text-xs font-medium text-gray-700">Motivo de anulación *</label>
            <Input value={motivoAnulacion} onChange={(e) => setMotivoAnulacion(e.target.value)} placeholder="Ej: Error en el importe" />
          </div>
          <div className="flex gap-2">
            <Button onClick={anular} disabled={anulando} className="flex-1 bg-red-600 hover:bg-red-700">
              {anulando ? 'Anulando…' : 'Confirmar anulación'}
            </Button>
            <Button variant="secondary" onClick={() => setShowAnularModal(false)} className="flex-1">Cancelar</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
