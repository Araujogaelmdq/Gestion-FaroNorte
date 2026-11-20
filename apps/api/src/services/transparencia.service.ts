import { eq, sql, and } from 'drizzle-orm';
import { db } from '../db/client.js';
import { club, socios, familias, movimientos, recibos, rubros } from '../db/schema.js';

// Config de transparencia almacenada en columnas adicionales del club (JSON en campo contacto no, mejor en un campo dedicado)
// Usamos un enfoque simple: guardamos la config en la tabla club como JSON en un campo nuevo
// Como no podemos alterar el schema fácilmente, guardamos en un Map en memoria con defaults
// y lo persistimos en un archivo JSON local

import fs from 'fs';
import path from 'path';

const CONFIG_PATH = path.resolve('apps/api/transparencia-config.json');

export interface TransparenciaConfig {
  publicada: boolean;
  mostrar_desde: string; // YYYY-MM
  mostrar_pct_cobrado: boolean;
  mostrar_cantidad_socios: boolean;
  mostrar_plata_cuentas: boolean;
  mostrar_detalle_gastos: boolean;
  mensaje_comision: string;
}

const DEFAULT_CONFIG: TransparenciaConfig = {
  publicada: false,
  mostrar_desde: new Date().toISOString().slice(0, 7),
  mostrar_pct_cobrado: true,
  mostrar_cantidad_socios: true,
  mostrar_plata_cuentas: false,
  mostrar_detalle_gastos: false,
  mensaje_comision: '',
};

export function getTransparenciaConfig(): TransparenciaConfig {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      return { ...DEFAULT_CONFIG, ...JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8')) };
    }
  } catch {}
  return { ...DEFAULT_CONFIG };
}

export function saveTransparenciaConfig(config: Partial<TransparenciaConfig>): TransparenciaConfig {
  const current = getTransparenciaConfig();
  const updated = { ...current, ...config };
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(updated, null, 2));
  return updated;
}

export async function getTransparenciaPublica() {
  const config = getTransparenciaConfig();
  const [clubData] = await db.select().from(club).where(eq(club.id, 1)).limit(1);

  if (!config.publicada) {
    return {
      publicada: false,
      nombre_club: clubData?.nombre || 'Faro Norte',
      mensaje: 'La información pública de este club no está disponible por el momento.',
    };
  }

  const response: any = {
    publicada: true,
    nombre_club: clubData?.nombre || 'Faro Norte',
    escudo_url: clubData?.escudo_url || null,
    mensaje: config.mensaje_comision,
  };

  const hoy = new Date();
  const desdeStr = config.mostrar_desde;

  if (config.mostrar_cantidad_socios) {
    const sociosActivos = await db.select().from(socios).where(eq(socios.estado, 'activo'));
    const familiasAll = await db.select().from(familias);
    response.cantidad_socios = sociosActivos.length;
    response.cantidad_familias = familiasAll.length;
  }

  if (config.mostrar_pct_cobrado) {
    // Cobranza de los últimos 3 meses
    const { cuotas: cuotasTable } = await import('../db/schema.js');
    const cuotasAll = await db.select().from(cuotasTable).where(eq(cuotasTable.anulado, false));
    const emitidas = cuotasAll.length;
    const cobradas = cuotasAll.filter((c) => c.pagado).length;
    response.pct_cobrado = emitidas > 0 ? Math.round((cobradas / emitidas) * 100) : 0;
  }

  if (config.mostrar_plata_cuentas) {
    const { cuentas: cuentasTable } = await import('../db/schema.js');
    const cuentasAll = await db.select().from(cuentasTable);
    const movsAll = await db.select().from(movimientos).where(eq(movimientos.anulado, false));
    const recibosAll = await db.select().from(recibos).where(eq(recibos.anulado, false));
    let total = 0;
    for (const c of cuentasAll) {
      let s = c.saldo_inicial;
      for (const m of movsAll) {
        if (m.tipo === 'ingreso' && m.cuenta_destino_id === c.id) s += m.importe;
        if (m.tipo === 'gasto' && m.cuenta_origen_id === c.id) s -= m.importe;
        if (m.tipo === 'transferencia') {
          if (m.cuenta_origen_id === c.id) s -= m.importe;
          if (m.cuenta_destino_id === c.id) s += m.importe;
        }
      }
      for (const r of recibosAll) { if (r.cuenta_id === c.id) s += r.total; }
      total += s;
    }
    response.plata_en_cuentas = total;
  }

  // Gastos e ingresos por rubro (públicos únicamente)
  const movsAll = await db.select().from(movimientos).where(and(eq(movimientos.anulado, false)));
  const rubrosAll = await db.select().from(rubros);
  const rubMap = new Map(rubrosAll.map((r) => [r.id, r]));

  const movsDesde = movsAll.filter((m) => m.fecha >= `${desdeStr}-01`);
  const ingresosPorRubro = new Map<string, number>();
  const gastosPorRubro = new Map<string, number>();

  for (const m of movsDesde.filter((m) => m.tipo !== 'transferencia')) {
    const rub = m.rubro_id ? rubMap.get(m.rubro_id) : null;
    if (m.tipo === 'ingreso') {
      const key = rub?.nombre || 'Otros';
      ingresosPorRubro.set(key, (ingresosPorRubro.get(key) || 0) + m.importe);
    }
    if (m.tipo === 'gasto') {
      const key = rub?.privado ? 'Otros' : (rub?.nombre || 'Otros');
      gastosPorRubro.set(key, (gastosPorRubro.get(key) || 0) + m.importe);
    }
  }

  // Sumar cuotas cobradas como ingreso
  const recibosDesde = await db.select().from(recibos).where(eq(recibos.anulado, false));
  const cobradoCuotas = recibosDesde.filter((r) => r.fecha >= `${desdeStr}-01`).reduce((a, r) => a + r.total, 0);
  if (cobradoCuotas > 0) ingresosPorRubro.set('Cuotas sociales', (ingresosPorRubro.get('Cuotas sociales') || 0) + cobradoCuotas);

  response.ingresos_por_rubro = Array.from(ingresosPorRubro.entries()).map(([nombre, monto]) => ({ nombre, monto }));
  response.gastos_por_rubro = Array.from(gastosPorRubro.entries()).map(([nombre, monto]) => ({ nombre, monto }));

  if (config.mostrar_detalle_gastos) {
    // Solo fecha, rubro (público), detalle, importe — NUNCA comprobante_url, usuario
    response.detalle_gastos = movsDesde
      .filter((m) => m.tipo === 'gasto' && !rubMap.get(m.rubro_id!)?.privado)
      .map((m) => ({
        fecha: m.fecha,
        rubro: rubMap.get(m.rubro_id!)?.nombre || 'Sin rubro',
        detalle: m.detalle,
        importe: m.importe,
      }))
      .sort((a, b) => b.fecha.localeCompare(a.fecha));
  }

  return response;
}

