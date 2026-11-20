import { useEffect, useState, useCallback } from 'react';
import { tesoreriaService } from '../services/modulos';
import { getCuentas, getRubros } from '../services/configuracion';
import { formatearMoneda } from '@faronorte/shared';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Modal } from '../components/Modal';
import { Badge } from '../components/Badge';

const TIPOS_MOV = [
  { value: '', label: 'Todos los tipos' },
  { value: 'ingreso', label: 'Ingresos' },
  { value: 'gasto', label: 'Gastos' },
  { value: 'transferencia', label: 'Transferencias' },
];

function mesActual() {
  const hoy = new Date();
  return `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}`;
}

const FORM_MOV_INICIAL = {
  tipo: 'gasto',
  importe: '',
  fecha: new Date().toISOString().split('T')[0],
  rubro_id: '',
  cuenta_origen_id: '',
  cuenta_destino_id: '',
  detalle: '',
};

export function Tesoreria() {
  const [saldos, setSaldos] = useState<any[]>([]);
  const [movimientos, setMovimientos] = useState<any[]>([]);
  const [totales, setTotales] = useState<any>(null);
  const [mes, setMes] = useState(mesActual());
  const [filtroTipo, setFiltroTipo] = useState('');
  const [cuentas, setCuentas] = useState<any[]>([]);
  const [rubros, setRubros] = useState<any[]>([]);
  const [showFormMov, setShowFormMov] = useState(false);
  const [formMov, setFormMov] = useState({ ...FORM_MOV_INICIAL });
  const [guardandoMov, setGuardandoMov] = useState(false);
  const [errorMov, setErrorMov] = useState('');
  const [showAnularModal, setShowAnularModal] = useState(false);
  const [movAnularId, setMovAnularId] = useState<number | null>(null);
  const [motivoAnulacion, setMotivoAnulacion] = useState('');
  const [anulando, setAnulando] = useState(false);
  const [tipoNuevo, setTipoNuevo] = useState<'gasto' | 'ingreso' | 'transferencia'>('gasto');

  const cargar = useCallback(async () => {
    const [s, m, t] = await Promise.all([
      tesoreriaService.saldos(),
      tesoreriaService.movimientos({ mes, tipo: filtroTipo || undefined }),
      tesoreriaService.totales(mes),
    ]);
    setSaldos(s.saldos);
    setMovimientos(m.movimientos);
    setTotales(t);
  }, [mes, filtroTipo]);

  useEffect(() => {
    cargar();
    getCuentas().then(setCuentas);
    getRubros().then(setRubros);
  }, [cargar]);

  function abrirForm(tipo: 'gasto' | 'ingreso' | 'transferencia') {
    setTipoNuevo(tipo);
    setFormMov({ ...FORM_MOV_INICIAL, tipo });
    setErrorMov('');
    setShowFormMov(true);
  }

  async function guardarMovimiento() {
    if (!formMov.importe || parseInt(formMov.importe) <= 0) { setErrorMov('El importe es obligatorio'); return; }
    if (formMov.tipo !== 'transferencia' && !formMov.rubro_id) { setErrorMov('El rubro es obligatorio'); return; }
    if (formMov.tipo === 'gasto' && !formMov.cuenta_origen_id) { setErrorMov('Elegí la cuenta'); return; }
    if (formMov.tipo === 'ingreso' && !formMov.cuenta_destino_id) { setErrorMov('Elegí la cuenta'); return; }
    if (formMov.tipo === 'transferencia' && (!formMov.cuenta_origen_id || !formMov.cuenta_destino_id)) {
      setErrorMov('Elegí ambas cuentas'); return;
    }
    setGuardandoMov(true);
    setErrorMov('');
    try {
      await tesoreriaService.crearMovimiento({
        ...formMov,
        importe: parseInt(formMov.importe),
        rubro_id: formMov.rubro_id ? parseInt(formMov.rubro_id) : null,
        cuenta_origen_id: formMov.cuenta_origen_id ? parseInt(formMov.cuenta_origen_id) : null,
        cuenta_destino_id: formMov.cuenta_destino_id ? parseInt(formMov.cuenta_destino_id) : null,
      });
      setShowFormMov(false);
      cargar();
    } catch (e: any) {
      setErrorMov(e.message || 'Error al guardar');
    } finally {
      setGuardandoMov(false);
    }
  }

  async function anularMovimiento() {
    if (!motivoAnulacion) { alert('El motivo es obligatorio'); return; }
    setAnulando(true);
    try {
      await tesoreriaService.anularMovimiento(movAnularId!, motivoAnulacion);
      setShowAnularModal(false);
      setMotivoAnulacion('');
      cargar();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setAnulando(false);
    }
  }

  const rubrosIngreso = rubros.filter((r: any) => r.tipo === 'ingreso' && r.activo);
  const rubrosGasto = rubros.filter((r: any) => r.tipo === 'gasto' && r.activo);
  const cuentasActivas = cuentas.filter((c: any) => c.activa);

  return (
    <div className="p-4 space-y-4 max-w-lg mx-auto pb-24">
      <h1 className="text-xl font-bold">Tesorería</h1>

      {/* Botones de acción */}
      <div className="flex gap-2">
        <Button onClick={() => abrirForm('gasto')} className="flex-1 text-sm bg-red-600 hover:bg-red-700">+ Gasto</Button>
        <Button onClick={() => abrirForm('ingreso')} className="flex-1 text-sm bg-green-600 hover:bg-green-700">+ Ingreso</Button>
        <Button onClick={() => abrirForm('transferencia')} className="flex-1 text-sm bg-blue-600 hover:bg-blue-700 text-xs">Transferir</Button>
      </div>

      {/* Saldos por cuenta (scroll horizontal) */}
      <div className="flex gap-3 overflow-x-auto pb-2">
        {saldos.map((s: any) => (
          <Card key={s.id} className="p-3 min-w-[140px] flex-shrink-0">
            <p className="text-xs text-gray-500 truncate">{s.nombre}</p>
            <p className={`text-lg font-bold ${s.saldo < 0 ? 'text-red-600' : 'text-gray-900'}`}>
              {formatearMoneda(s.saldo)}
            </p>
          </Card>
        ))}
      </div>

      {/* Filtros de mes y tipo */}
      <div className="flex gap-2">
        <Input type="month" value={mes} onChange={(e) => setMes(e.target.value)} className="flex-1" />
        <select
          value={filtroTipo}
          onChange={(e) => setFiltroTipo(e.target.value)}
          className="border rounded-lg px-2 py-1.5 text-sm text-gray-700 flex-1"
        >
          {TIPOS_MOV.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
      </div>

      {/* Totales del mes */}
      {totales && (
        <Card className="p-3 grid grid-cols-3 gap-2 text-center">
          <div>
            <p className="text-xs text-gray-500">Entró</p>
            <p className="font-bold text-green-600 text-sm">{formatearMoneda(totales.entro)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Salió</p>
            <p className="font-bold text-red-600 text-sm">{formatearMoneda(totales.salio)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Resultado</p>
            <p className={`font-bold text-sm ${totales.resultado >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
              {formatearMoneda(totales.resultado)}
            </p>
          </div>
        </Card>
      )}
      <p className="text-xs text-gray-400">Las transferencias entre cuentas no cuentan como ingreso ni gasto.</p>

      {/* Botón exportar */}
      <div className="flex justify-end">
        <a href={tesoreriaService.exportarUrl({ mes })} target="_blank" rel="noopener noreferrer">
          <Button variant="secondary" className="text-sm">📊 Bajar planilla (Excel)</Button>
        </a>
      </div>

      {/* Lista de movimientos */}
      {movimientos.length === 0 ? (
        <Card className="p-6 text-center text-gray-400">
          <p>No hay movimientos en este período.</p>
          <Button onClick={() => abrirForm('gasto')} className="mt-3">Cargar un gasto</Button>
        </Card>
      ) : (
        <div className="space-y-2">
          {movimientos.map((m: any) => (
            <Card key={m.id} className={`p-3 ${m.anulado ? 'opacity-50' : ''}`}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant={m.tipo === 'ingreso' ? 'success' : m.tipo === 'gasto' ? 'danger' : 'teal'} size="sm">{m.tipo}</Badge>
                    <span className="text-sm font-semibold truncate">{m.rubro_nombre || (m.tipo === 'transferencia' ? `${m.cuenta_origen_nombre} → ${m.cuenta_destino_nombre}` : 'Sin rubro')}</span>
                    {m.anulado && <Badge variant="danger" size="sm">ANULADO</Badge>}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">{m.fecha} · {m.usuario_nombre}</p>
                  {m.detalle && <p className="text-xs text-gray-500 truncate">{m.detalle}</p>}
                </div>
                <div className="text-right flex flex-col items-end gap-1">
                  <p className={`font-bold ${m.tipo === 'ingreso' ? 'text-green-600' : m.tipo === 'gasto' ? 'text-red-600' : 'text-blue-600'}`}>
                    {m.tipo === 'ingreso' ? '+' : m.tipo === 'gasto' ? '-' : ''}{formatearMoneda(m.importe)}
                  </p>
                  {!m.anulado && (
                    <button
                      onClick={() => { setMovAnularId(m.id); setShowAnularModal(true); }}
                      className="text-xs text-red-500 underline"
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

      {/* Modal nuevo movimiento */}
      <Modal isOpen={showFormMov} onClose={() => setShowFormMov(false)} title={`Cargar ${tipoNuevo}`}>
        <div className="space-y-3">
          {errorMov && <div className="bg-red-50 text-red-700 text-sm p-2 rounded-lg">{errorMov}</div>}
          <div>
            <label className="text-xs font-medium text-gray-700">Tipo</label>
            <select
              value={formMov.tipo}
              onChange={(e) => setFormMov((f) => ({ ...f, tipo: e.target.value }))}
              className="w-full border rounded-lg px-3 py-2 text-sm mt-0.5"
            >
              <option value="gasto">Gasto</option>
              <option value="ingreso">Ingreso</option>
              <option value="transferencia">Transferencia</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-medium text-gray-700">Importe *</label>
              <Input type="number" value={formMov.importe} onChange={(e) => setFormMov((f) => ({ ...f, importe: e.target.value }))} placeholder="0" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-700">Fecha *</label>
              <Input type="date" value={formMov.fecha} onChange={(e) => setFormMov((f) => ({ ...f, fecha: e.target.value }))} />
            </div>
          </div>
          {formMov.tipo !== 'transferencia' && (
            <div>
              <label className="text-xs font-medium text-gray-700">Rubro *</label>
              <select
                value={formMov.rubro_id}
                onChange={(e) => setFormMov((f) => ({ ...f, rubro_id: e.target.value }))}
                className="w-full border rounded-lg px-3 py-2 text-sm mt-0.5"
              >
                <option value="">Elegí un rubro</option>
                {(formMov.tipo === 'gasto' ? rubrosGasto : rubrosIngreso).map((r: any) => (
                  <option key={r.id} value={r.id}>{r.nombre}</option>
                ))}
              </select>
            </div>
          )}
          {(formMov.tipo === 'gasto' || formMov.tipo === 'transferencia') && (
            <div>
              <label className="text-xs font-medium text-gray-700">Cuenta origen *</label>
              <select
                value={formMov.cuenta_origen_id}
                onChange={(e) => setFormMov((f) => ({ ...f, cuenta_origen_id: e.target.value }))}
                className="w-full border rounded-lg px-3 py-2 text-sm mt-0.5"
              >
                <option value="">Elegí la cuenta</option>
                {cuentasActivas.map((c: any) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
              </select>
            </div>
          )}
          {(formMov.tipo === 'ingreso' || formMov.tipo === 'transferencia') && (
            <div>
              <label className="text-xs font-medium text-gray-700">Cuenta destino *</label>
              <select
                value={formMov.cuenta_destino_id}
                onChange={(e) => setFormMov((f) => ({ ...f, cuenta_destino_id: e.target.value }))}
                className="w-full border rounded-lg px-3 py-2 text-sm mt-0.5"
              >
                <option value="">Elegí la cuenta</option>
                {cuentasActivas.map((c: any) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
              </select>
            </div>
          )}
          <div>
            <label className="text-xs font-medium text-gray-700">Detalle (opcional)</label>
            <Input value={formMov.detalle} onChange={(e) => setFormMov((f) => ({ ...f, detalle: e.target.value }))} placeholder="Descripción del movimiento" />
          </div>
          <div className="flex gap-2 pt-2">
            <Button onClick={guardarMovimiento} disabled={guardandoMov} className="flex-1">
              {guardandoMov ? 'Guardando…' : 'Guardar'}
            </Button>
            <Button variant="secondary" onClick={() => setShowFormMov(false)} className="flex-1">Cancelar</Button>
          </div>
        </div>
      </Modal>

      {/* Modal anulación */}
      <Modal isOpen={showAnularModal} onClose={() => setShowAnularModal(false)} title="Anular movimiento">
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-gray-700">Motivo *</label>
            <Input value={motivoAnulacion} onChange={(e) => setMotivoAnulacion(e.target.value)} placeholder="Ej: Error en el importe" />
          </div>
          <div className="flex gap-2">
            <Button onClick={anularMovimiento} disabled={anulando} className="flex-1 bg-red-600 hover:bg-red-700">
              {anulando ? 'Anulando…' : 'Anular'}
            </Button>
            <Button variant="secondary" onClick={() => setShowAnularModal(false)} className="flex-1">Cancelar</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
