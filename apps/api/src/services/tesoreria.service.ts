import { eq, sql, and, desc } from 'drizzle-orm';
import { db } from '../db/client.js';
import { movimientos, cuentas, rubros, recibos, recibo_items, usuarios } from '../db/schema.js';
import ExcelJS from 'exceljs';

export async function getSaldosCuentas() {
  const todasLasCuentas = await db.select().from(cuentas).where(eq(cuentas.activa, true));

  // Movimientos no anulados
  const movs = await db.select().from(movimientos).where(eq(movimientos.anulado, false));

  // Recibos no anulados (cobros de cuotas → crédito a la cuenta)
  const recibosNAnulados = await db.select().from(recibos).where(eq(recibos.anulado, false));

  return todasLasCuentas.map((cuenta) => {
    let saldo = cuenta.saldo_inicial;

    for (const m of movs) {
      if (m.tipo === 'ingreso' && m.cuenta_destino_id === cuenta.id) saldo += m.importe;
      if (m.tipo === 'gasto' && m.cuenta_origen_id === cuenta.id) saldo -= m.importe;
      if (m.tipo === 'transferencia') {
        if (m.cuenta_origen_id === cuenta.id) saldo -= m.importe;
        if (m.cuenta_destino_id === cuenta.id) saldo += m.importe;
      }
    }

    // Cobros de cuotas
    for (const r of recibosNAnulados) {
      if (r.cuenta_id === cuenta.id) saldo += r.total;
    }

    return { id: cuenta.id, nombre: cuenta.nombre, saldo, saldo_inicial: cuenta.saldo_inicial };
  });
}

export async function getMovimientos(filters: {
  mes?: string;
  tipo?: string;
  cuenta_id?: number;
  rubro_id?: number;
  q?: string;
}) {
  const rows = await db.select().from(movimientos).orderBy(desc(movimientos.fecha), desc(movimientos.id));
  const rubrosAll = await db.select().from(rubros);
  const cuentasAll = await db.select().from(cuentas);
  const usuariosAll = await db.select().from(usuarios);
  const rubMap = new Map(rubrosAll.map((r) => [r.id, r]));
  const ctaMap = new Map(cuentasAll.map((c) => [c.id, c]));
  const usrMap = new Map(usuariosAll.map((u) => [u.id, u]));

  let result = rows.map((m) => ({
    id: m.id,
    tipo: m.tipo,
    importe: m.importe,
    fecha: m.fecha,
    rubro_id: m.rubro_id,
    rubro_nombre: m.rubro_id ? rubMap.get(m.rubro_id)?.nombre || null : null,
    cuenta_origen_id: m.cuenta_origen_id,
    cuenta_origen_nombre: m.cuenta_origen_id ? ctaMap.get(m.cuenta_origen_id)?.nombre || null : null,
    cuenta_destino_id: m.cuenta_destino_id,
    cuenta_destino_nombre: m.cuenta_destino_id ? ctaMap.get(m.cuenta_destino_id)?.nombre || null : null,
    detalle: m.detalle,
    comprobante_url: m.comprobante_url,
    anulado: m.anulado,
    motivo_anulacion: m.motivo_anulacion,
    usuario_nombre: usrMap.get(m.usuario_id)?.nombre || '',
    creado_en: m.creado_en,
  }));

  if (filters.mes) result = result.filter((m) => m.fecha.startsWith(filters.mes!));
  if (filters.tipo) result = result.filter((m) => m.tipo === filters.tipo);
  if (filters.cuenta_id) result = result.filter((m) => m.cuenta_origen_id === filters.cuenta_id || m.cuenta_destino_id === filters.cuenta_id);
  if (filters.rubro_id) result = result.filter((m) => m.rubro_id === filters.rubro_id);
  if (filters.q) {
    const lower = filters.q.toLowerCase();
    result = result.filter((m) => (m.detalle || '').toLowerCase().includes(lower) || (m.rubro_nombre || '').toLowerCase().includes(lower));
  }

  return result;
}

export async function getTotalesMes(mes: string) {
  const movs = await db.select().from(movimientos).where(eq(movimientos.anulado, false));
  const delMes = movs.filter((m) => m.fecha.startsWith(mes) && m.tipo !== 'transferencia');
  const entro = delMes.filter((m) => m.tipo === 'ingreso').reduce((acc, m) => acc + m.importe, 0);
  const salio = delMes.filter((m) => m.tipo === 'gasto').reduce((acc, m) => acc + m.importe, 0);

  // Sumar también cobros de cuotas del mes
  const recibosDelMes = await db.select().from(recibos).where(and(eq(recibos.anulado, false)));
  const cobradoMes = recibosDelMes.filter((r) => r.fecha.startsWith(mes)).reduce((acc, r) => acc + r.total, 0);

  return { entro: entro + cobradoMes, salio, resultado: (entro + cobradoMes) - salio };
}

export async function crearMovimiento(input: {
  tipo: string;
  importe: number;
  fecha: string;
  rubro_id?: number | null;
  cuenta_origen_id?: number | null;
  cuenta_destino_id?: number | null;
  detalle?: string | null;
  usuario_id: number;
}) {
  const [mov] = await db.insert(movimientos).values({
    tipo: input.tipo as any,
    importe: input.importe,
    fecha: input.fecha,
    rubro_id: input.rubro_id || null,
    cuenta_origen_id: input.cuenta_origen_id || null,
    cuenta_destino_id: input.cuenta_destino_id || null,
    detalle: input.detalle || null,
    usuario_id: input.usuario_id,
    anulado: false,
  }).returning();
  return mov;
}

export async function anularMovimiento(id: number, motivo: string) {
  const [m] = await db.select().from(movimientos).where(eq(movimientos.id, id)).limit(1);
  if (!m) { const e: any = new Error('Movimiento no encontrado'); e.statusCode = 404; throw e; }
  if (m.anulado) { const e: any = new Error('El movimiento ya está anulado'); e.statusCode = 400; throw e; }
  await db.update(movimientos).set({ anulado: true, motivo_anulacion: motivo }).where(eq(movimientos.id, id));
}

export async function exportarTesoreriaExcel(filters: {
  desde?: string;
  hasta?: string;
  tipo?: string;
  cuenta_id?: number;
  rubro_id?: number;
}) {
  const movs = await getMovimientos({
    mes: undefined,
    tipo: filters.tipo,
    cuenta_id: filters.cuenta_id,
    rubro_id: filters.rubro_id,
  });

  let result = movs;
  if (filters.desde) result = result.filter((m) => m.fecha >= filters.desde!);
  if (filters.hasta) result = result.filter((m) => m.fecha <= filters.hasta!);

  const saldos = await getSaldosCuentas();

  const workbook = new ExcelJS.Workbook();

  const sheet1 = workbook.addWorksheet('Movimientos');
  const headers = ['Fecha', 'Tipo', 'Rubro', 'Cuenta origen', 'Cuenta destino', 'Detalle', 'Importe', 'Anulado', 'Usuario'];
  sheet1.addRow(headers);
  sheet1.getRow(1).font = { bold: true };
  for (const m of result) {
    sheet1.addRow([
      m.fecha, m.tipo, m.rubro_nombre || '', m.cuenta_origen_nombre || '',
      m.cuenta_destino_nombre || '', m.detalle || '',
      m.anulado ? 0 : m.importe, m.anulado ? 'Sí' : 'No', m.usuario_nombre,
    ]);
  }
  headers.forEach((_, i) => { sheet1.getColumn(i + 1).width = 20; });

  const sheet2 = workbook.addWorksheet('Saldos por cuenta');
  sheet2.addRow(['Cuenta', 'Saldo']);
  sheet2.getRow(1).font = { bold: true };
  for (const s of saldos) sheet2.addRow([s.nombre, s.saldo]);

  return workbook;
}

