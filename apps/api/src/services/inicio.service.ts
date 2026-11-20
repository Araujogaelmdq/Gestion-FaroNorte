import { eq, sql, and } from 'drizzle-orm';
import { db } from '../db/client.js';
import { socios, familias, cuotas, recibos, movimientos, cuentas, categorias, club, usuarios } from '../db/schema.js';

export async function getInicioDashboard() {
  const hoy = new Date();
  const mesActual = hoy.toISOString().slice(0, 7); // YYYY-MM
  const hoyStr = hoy.toISOString().split('T')[0];

  const [clubData] = await db.select().from(club).where(eq(club.id, 1)).limit(1);
  const cats = await db.select().from(categorias);
  const sociosAll = await db.select().from(socios);
  const familiasAll = await db.select().from(familias);
  const usuariosAll = await db.select().from(usuarios);
  const cuentasAll = await db.select().from(cuentas);

  const sociosActivos = sociosAll.filter((s) => s.estado === 'activo');
  const familiasCount = familiasAll.length;

  // Cobrado este mes
  const recibosAll = await db.select().from(recibos).where(eq(recibos.anulado, false));
  const recibosMes = recibosAll.filter((r) => r.fecha.startsWith(mesActual));
  const cobradoMes = { monto: recibosMes.reduce((a, r) => a + r.total, 0), cuotas: recibosMes.length };

  // Deuda vencida
  const cuotasAll = await db.select().from(cuotas).where(and(eq(cuotas.pagado, false), eq(cuotas.anulado, false)));
  const cuotasVencidas = cuotasAll.filter((c) => c.vence_en < hoyStr);
  const sociosActivosSet = new Set(sociosActivos.map((s) => s.id));
  const cuotasVencidasActivos = cuotasVencidas.filter((c) => sociosActivosSet.has(c.socio_id));
  const deudaVencida = {
    monto: cuotasVencidasActivos.reduce((a, c) => a + c.importe, 0),
    familias: new Set(cuotasVencidasActivos.map((c) => sociosAll.find((s) => s.id === c.socio_id)?.familia_id).filter(Boolean)).size,
  };

  // Plata en cuentas: saldo_inicial + ingresos - gastos + cobros - transferencias salientes + transferencias entrantes
  const movsAll = await db.select().from(movimientos).where(eq(movimientos.anulado, false));
  let plataTotal = 0;
  for (const cuenta of cuentasAll) {
    let s = cuenta.saldo_inicial;
    for (const m of movsAll) {
      if (m.tipo === 'ingreso' && m.cuenta_destino_id === cuenta.id) s += m.importe;
      if (m.tipo === 'gasto' && m.cuenta_origen_id === cuenta.id) s -= m.importe;
      if (m.tipo === 'transferencia') {
        if (m.cuenta_origen_id === cuenta.id) s -= m.importe;
        if (m.cuenta_destino_id === cuenta.id) s += m.importe;
      }
    }
    for (const r of recibosAll) {
      if (r.cuenta_id === cuenta.id) s += r.total;
    }
    plataTotal += s;
  }

  // Gastos este mes
  const gastosMes = movsAll.filter((m) => m.tipo === 'gasto' && m.fecha.startsWith(mesActual)).reduce((a, m) => a + m.importe, 0);

  // Aptos vencidos
  const aptosVencidos = sociosActivos.filter((s) => s.vencimiento_apto && s.vencimiento_apto < hoyStr).length;

  // Cuotas faltantes para el mes actual
  const cuotasMesActual = await db.select({ socio_id: cuotas.socio_id }).from(cuotas).where(eq(cuotas.periodo, mesActual));
  const tieneCuota = new Set(cuotasMesActual.map((c) => c.socio_id));
  const cuotasFaltantesGenerar = sociosActivos.filter((s) => !tieneCuota.has(s.id)).length;

  // Primeros pasos
  const primerosPasos = {
    datosClub: !!(clubData?.nombre && clubData.nombre !== 'Faro Norte'),
    valorCuota: cats.some((c) => c.valor_cuota_centavos > 0),
    sociosCargados: sociosActivos.length > 0,
    equipo: usuariosAll.length > 1,
  };

  return {
    sociosActivos: sociosActivos.length,
    familiasCount,
    cobradoMes,
    deudaVencida,
    plataEnCuentas: plataTotal,
    gastosMes,
    aptosVencidos,
    cuotasFaltantesGenerar,
    mesActual,
    primerosPasos,
  };
}

