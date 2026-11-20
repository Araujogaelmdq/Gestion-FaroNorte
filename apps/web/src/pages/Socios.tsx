import { useEffect, useState, useCallback } from 'react';
import { sociosService, familiasService } from '../services/modulos';
import { getCategorias } from '../services/configuracion';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Select } from '../components/Select';
import { Modal } from '../components/Modal';
import { Tabs } from '../components/Tabs';
import { formatearFecha } from '@faronorte/shared';

const ESTADOS_APTO: Record<string, { label: string; color: string }> = {
  vigente: { label: 'Apto vigente', color: 'green' },
  vencido: { label: 'Apto vencido', color: 'orange' },
  sin_apto: { label: 'Sin apto', color: 'gray' },
};

const ESTADOS_SOCIO: Record<string, { label: string; color: string }> = {
  activo: { label: 'Activo', color: 'green' },
  baja: { label: 'Baja', color: 'red' },
  vitalicio: { label: 'Vitalicio', color: 'blue' },
};

const FORM_INICIAL = {
  apellido: '', nombre: '', dni: '', nacimiento: '', categoria_id: '', familia_id: '',
  tutor: '', telefono: '', estado: 'activo', vencimiento_apto: '',
};

export function Socios() {
  const [tab, setTab] = useState('socios');
  const [socios, setSocios] = useState<any[]>([]);
  const [familias, setFamilias] = useState<any[]>([]);
  const [categorias, setCategorias] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [filtroApto, setFiltroApto] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [form, setForm] = useState({ ...FORM_INICIAL });
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const [familiaQ, setFamiliaQ] = useState('');

  const cargarSocios = useCallback(async () => {
    setLoading(true);
    try {
      const res = await sociosService.listar({
        q: q || undefined,
        estado: filtroEstado || undefined,
        estado_apto: filtroApto || undefined,
        categoria_id: filtroCategoria ? parseInt(filtroCategoria) : undefined,
      });
      setSocios(res.socios);
    } finally {
      setLoading(false);
    }
  }, [q, filtroEstado, filtroApto, filtroCategoria]);

  useEffect(() => {
    cargarSocios();
    familiasService.listar().then((r) => setFamilias(r.familias));
    getCategorias().then(setCategorias);
  }, [cargarSocios]);

  function abrirNuevo() {
    setEditandoId(null);
    setForm({ ...FORM_INICIAL });
    setError('');
    setShowModal(true);
  }

  function abrirEdicion(s: any) {
    setEditandoId(s.id);
    setForm({
      apellido: s.apellido || '',
      nombre: s.nombre || '',
      dni: s.dni || '',
      nacimiento: s.nacimiento || '',
      categoria_id: s.categoria_id ? String(s.categoria_id) : '',
      familia_id: s.familia_id ? String(s.familia_id) : '',
      tutor: s.tutor || '',
      telefono: s.telefono || '',
      estado: s.estado || 'activo',
      vencimiento_apto: s.vencimiento_apto || '',
    });
    setError('');
    setShowModal(true);
  }

  async function guardar() {
    if (!form.apellido || !form.nombre || !form.dni) {
      setError('Apellido, nombre y DNI son obligatorios.');
      return;
    }
    setGuardando(true);
    setError('');
    try {
      const payload = {
        ...form,
        categoria_id: form.categoria_id ? parseInt(form.categoria_id) : null,
        familia_id: form.familia_id ? parseInt(form.familia_id) : null,
        nacimiento: form.nacimiento || null,
        tutor: form.tutor || null,
        telefono: form.telefono || null,
        vencimiento_apto: form.vencimiento_apto || null,
      };
      if (editandoId) {
        await sociosService.actualizar(editandoId, payload);
      } else {
        await sociosService.crear(payload);
      }
      setShowModal(false);
      cargarSocios();
    } catch (e: any) {
      setError(e.message || 'Error al guardar');
    } finally {
      setGuardando(false);
    }
  }

  const famFiltered = familias.filter((f) =>
    !familiaQ || f.nombre.toLowerCase().includes(familiaQ.toLowerCase())
  );

  return (
    <div className="p-4 space-y-4 max-w-lg mx-auto pb-24">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Socios</h1>
        <Button onClick={abrirNuevo} className="text-sm px-3 py-1.5">+ Nuevo socio</Button>
      </div>

      <Tabs
        tabs={[
          { id: 'socios', label: 'Socios' },
          { id: 'familias', label: 'Familias' },
          { id: 'importar', label: 'Importar / exportar' },
        ]}
        activeTab={tab}
        onChange={setTab}
      />

      {/* Tab Socios */}
      {tab === 'socios' && (
        <div className="space-y-3">
          {/* Buscador y filtros */}
          <Input
            placeholder="Buscar por nombre, DNI, número…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <div className="flex gap-2 flex-wrap">
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="border rounded-lg px-2 py-1.5 text-sm text-gray-700 flex-1 min-w-[100px]"
            >
              <option value="">Todos los estados</option>
              <option value="activo">Activo</option>
              <option value="baja">Baja</option>
              <option value="vitalicio">Vitalicio</option>
            </select>
            <select
              value={filtroApto}
              onChange={(e) => setFiltroApto(e.target.value)}
              className="border rounded-lg px-2 py-1.5 text-sm text-gray-700 flex-1 min-w-[100px]"
            >
              <option value="">Todos los aptos</option>
              <option value="vigente">Apto vigente</option>
              <option value="vencido">Apto vencido</option>
              <option value="sin_apto">Sin apto</option>
            </select>
            <select
              value={filtroCategoria}
              onChange={(e) => setFiltroCategoria(e.target.value)}
              className="border rounded-lg px-2 py-1.5 text-sm text-gray-700 flex-1 min-w-[100px]"
            >
              <option value="">Todas las categorías</option>
              {categorias.map((c: any) => (
                <option key={c.id} value={c.id}>{c.nombre}</option>
              ))}
            </select>
          </div>

          <p className="text-sm text-gray-500">{socios.length} socio(s)</p>

          {loading ? (
            <p className="text-center text-gray-400 py-8">Cargando…</p>
          ) : socios.length === 0 ? (
            <Card className="p-6 text-center text-gray-400">
              <p>No hay socios con esos filtros.</p>
              <Button onClick={abrirNuevo} className="mt-3">Agregar el primero</Button>
            </Card>
          ) : (
            <div className="space-y-2">
              {socios.map((s, idx) => (
                <Card
                  key={s.id}
                  interactive
                  className="p-3.5 cursor-pointer card-interactive hover:border-orange-200 transition-all animate-fade-in-up"
                  style={{ animationDelay: `${Math.min(idx * 30, 300)}ms` }}
                  onClick={() => abrirEdicion(s)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs text-gray-400">#{s.numero}</span>
                        <span className="font-semibold text-gray-900 truncate">{s.apellido}, {s.nombre}</span>
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {s.categoria_nombre || 'Sin categoría'} · {s.edad != null ? `${s.edad} años` : 'Sin nacimiento'} · {s.familia_nombre || 'Sin familia'}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge variant="default" size="sm">
                        {ESTADOS_SOCIO[s.estado]?.label || s.estado}
                      </Badge>
                      <Badge variant="default" size="sm">
                        {ESTADOS_APTO[s.estado_apto]?.label || s.estado_apto}
                      </Badge>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab Familias */}
      {tab === 'familias' && (
        <div className="space-y-3">
          <Input
            placeholder="Buscar familia o responsable…"
            value={familiaQ}
            onChange={(e) => setFamiliaQ(e.target.value)}
          />
          <p className="text-sm text-gray-500">{famFiltered.length} familia(s)</p>
          {famFiltered.length === 0 ? (
            <Card className="p-6 text-center text-gray-400">No hay familias cargadas.</Card>
          ) : (
            <div className="space-y-2">
              {famFiltered.map((f: any) => (
                <Card key={f.id} className="p-3">
                  <div className="font-semibold text-gray-900">{f.nombre}</div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    Responsable: {f.responsable_nombre || '-'} · {f.cantidad_socios} socio(s) activo(s)
                  </div>
                  {f.responsable_telefono && (
                    <a href={`tel:${f.responsable_telefono}`} className="text-xs text-blue-600 mt-0.5 block">
                      📞 {f.responsable_telefono}
                    </a>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab Importar/exportar */}
      {tab === 'importar' && (
        <div className="space-y-4">
          <Card className="p-4 space-y-3">
            <h2 className="font-bold text-gray-900">1. Bajá la planilla modelo</h2>
            <p className="text-sm text-gray-500">Completá la planilla y luego importala. El DNI es el identificador único; si ya existe, se actualiza.</p>
            <div className="flex gap-2 flex-wrap">
              <a href="/api/socios/plantilla" target="_blank" rel="noopener noreferrer">
                <Button className="text-sm">📥 Planilla Excel (.xlsx)</Button>
              </a>
            </div>
          </Card>

          <Card className="p-4 space-y-3">
            <h2 className="font-bold text-gray-900">2. Exportar el padrón</h2>
            <p className="text-sm text-gray-500">Descargá todos los socios en formato Excel.</p>
            <a href="/api/socios/exportar" target="_blank" rel="noopener noreferrer">
              <Button variant="secondary" className="text-sm">📤 Descargar padrón</Button>
            </a>
          </Card>
        </div>
      )}

      {/* Modal alta/edición */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editandoId ? 'Editar socio' : 'Nuevo socio'}
      >
        <div className="space-y-3">
          {error && <div className="bg-red-50 text-red-700 text-sm p-2 rounded-lg">{error}</div>}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-medium text-gray-700">Apellido *</label>
              <Input value={form.apellido} onChange={(e) => setForm((f) => ({ ...f, apellido: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-700">Nombre *</label>
              <Input value={form.nombre} onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-medium text-gray-700">DNI *</label>
              <Input value={form.dni} onChange={(e) => setForm((f) => ({ ...f, dni: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-700">Nacimiento</label>
              <Input type="date" value={form.nacimiento} onChange={(e) => setForm((f) => ({ ...f, nacimiento: e.target.value }))} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-medium text-gray-700">Categoría</label>
              <select
                value={form.categoria_id}
                onChange={(e) => setForm((f) => ({ ...f, categoria_id: e.target.value }))}
                className="w-full border rounded-lg px-3 py-2 text-sm text-gray-700 mt-0.5"
              >
                <option value="">Sin categoría</option>
                {categorias.map((c: any) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-700">Familia</label>
              <select
                value={form.familia_id}
                onChange={(e) => setForm((f) => ({ ...f, familia_id: e.target.value }))}
                className="w-full border rounded-lg px-3 py-2 text-sm text-gray-700 mt-0.5"
              >
                <option value="">Sin familia</option>
                {familias.map((fa: any) => <option key={fa.id} value={fa.id}>{fa.nombre}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-700">Tutor (si es menor)</label>
            <Input value={form.tutor} onChange={(e) => setForm((f) => ({ ...f, tutor: e.target.value }))} placeholder="Nombre y apellido del tutor" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-medium text-gray-700">Teléfono</label>
              <Input value={form.telefono} onChange={(e) => setForm((f) => ({ ...f, telefono: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-700">Estado</label>
              <select
                value={form.estado}
                onChange={(e) => setForm((f) => ({ ...f, estado: e.target.value }))}
                className="w-full border rounded-lg px-3 py-2 text-sm text-gray-700 mt-0.5"
              >
                <option value="activo">Activo</option>
                <option value="baja">Baja</option>
                <option value="vitalicio">Vitalicio</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-700">Vencimiento apto médico</label>
            <Input type="date" value={form.vencimiento_apto} onChange={(e) => setForm((f) => ({ ...f, vencimiento_apto: e.target.value }))} />
          </div>
          <div className="flex gap-2 pt-2">
            <Button onClick={guardar} disabled={guardando} className="flex-1">
              {guardando ? 'Guardando…' : (editandoId ? 'Guardar cambios' : 'Crear socio')}
            </Button>
            <Button variant="secondary" onClick={() => setShowModal(false)} className="flex-1">Cancelar</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
