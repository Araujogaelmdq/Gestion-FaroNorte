import { useEffect, useState } from 'react';
import { transparenciaService } from '../services/modulos';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';

const MESES_OPTS = Array.from({ length: 24 }, (_, i) => {
  const d = new Date();
  d.setMonth(d.getMonth() - i);
  const v = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  return { value: v, label: v };
});

export function Transparencia() {
  const [config, setConfig] = useState<any>(null);
  const [guardando, setGuardando] = useState(false);
  const [guardado, setGuardado] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    transparenciaService.getConfig()
      .then((r) => setConfig(r.config))
      .catch(() => setConfig({ publicada: false, mostrar_desde: '', mostrar_pct_cobrado: true, mostrar_cantidad_socios: true, mostrar_plata_cuentas: false, mostrar_detalle_gastos: false, mensaje_comision: '' }))
      .finally(() => setLoading(false));
  }, []);

  async function guardar() {
    setGuardando(true);
    try {
      const res = await transparenciaService.saveConfig(config);
      setConfig(res.config);
      setGuardado(true);
      setTimeout(() => setGuardado(false), 2000);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setGuardando(false);
    }
  }

  if (loading) return <div className="p-4 text-center text-gray-400">Cargando…</div>;

  const urlPublica = `${window.location.origin}/transparencia`;

  return (
    <div className="p-4 space-y-4 max-w-lg mx-auto pb-24">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Transparencia</h1>
        <span className={`text-sm font-semibold px-2 py-1 rounded-full ${config?.publicada ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
          {config?.publicada ? 'Pública' : 'No publicada'}
        </span>
      </div>

      {config?.publicada && (
        <Card className="p-3 space-y-2">
          <p className="text-xs text-gray-500 font-medium">Link de la página pública</p>
          <p className="text-sm text-blue-600 break-all">{urlPublica}</p>
          <div className="flex gap-2 flex-wrap">
            <a href="/transparencia" target="_blank" rel="noopener noreferrer">
              <Button variant="secondary" className="text-sm">Ver página</Button>
            </a>
            <button
              onClick={() => navigator.clipboard.writeText(urlPublica).then(() => alert('Link copiado!'))}
              className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 hover:bg-gray-50"
            >
              Copiar link
            </button>
            <a
              href={`https://wa.me/?text=${encodeURIComponent(`Podés ver la transparencia de Faro Norte en: ${urlPublica}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm bg-green-100 text-green-700 rounded-lg px-3 py-1.5 font-medium"
            >
              Compartir 💬
            </a>
          </div>
        </Card>
      )}

      <Card className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold text-gray-900">Publicar la página</p>
            <p className="text-xs text-gray-500">Cualquiera con el link puede ver los datos que habilitás.</p>
          </div>
          <button
            onClick={() => setConfig((c: any) => ({ ...c, publicada: !c.publicada }))}
            className={`relative w-12 h-6 rounded-full transition-colors ${config?.publicada ? 'bg-blue-600' : 'bg-gray-300'}`}
          >
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${config?.publicada ? 'translate-x-6' : ''}`} />
          </button>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700">Mostrar datos desde</label>
          <select
            value={config?.mostrar_desde || ''}
            onChange={(e) => setConfig((c: any) => ({ ...c, mostrar_desde: e.target.value }))}
            className="w-full border rounded-lg px-3 py-2 text-sm mt-1"
          >
            {MESES_OPTS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700">¿Qué querés mostrar?</p>
          {[
            { key: 'mostrar_pct_cobrado', label: '% de cobranza de cuotas' },
            { key: 'mostrar_cantidad_socios', label: 'Cantidad de socios y familias' },
            { key: 'mostrar_plata_cuentas', label: 'Total de plata en cuentas' },
            { key: 'mostrar_detalle_gastos', label: 'Detalle de gastos (rubros públicos)' },
          ].map((item) => (
            <label key={item.key} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={config?.[item.key] || false}
                onChange={(e) => setConfig((c: any) => ({ ...c, [item.key]: e.target.checked }))}
                className="rounded"
              />
              <span className="text-sm text-gray-700">{item.label}</span>
            </label>
          ))}
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700">Mensaje de la comisión</label>
          <textarea
            value={config?.mensaje_comision || ''}
            onChange={(e) => setConfig((c: any) => ({ ...c, mensaje_comision: e.target.value }))}
            rows={3}
            placeholder="Ej: Estamos trabajando para mejorar el club…"
            className="w-full border rounded-lg px-3 py-2 text-sm mt-1 resize-none"
          />
        </div>

        <Button onClick={guardar} disabled={guardando} className="w-full">
          {guardado ? '✓ Guardado' : (guardando ? 'Guardando…' : 'Guardar configuración')}
        </Button>
      </Card>

      <Card className="p-4">
        <h2 className="font-semibold text-gray-900 mb-2">🔒 Qué nunca se publica</h2>
        <ul className="text-sm text-gray-500 space-y-1 list-disc list-inside">
          <li>Nombres, DNI ni teléfonos de socios</li>
          <li>Fotos ni comprobantes</li>
          <li>Rubros marcados como "Privado" en Configuración</li>
          <li>Información de usuarios del sistema</li>
        </ul>
      </Card>
    </div>
  );
}
