import { eq, sql, and } from 'drizzle-orm';
import { db } from '../db/client.js';
import { movimientos, cuotas, socios, familias, recibos, rubros, cuentas } from '../db/schema.js';
import ExcelJS from 'exceljs';

export async function getReporteIngresosGastos(desde?: string, hasta?: string) {
  const movsAll = await db.select().from(movimientos).where(eq(movimientos.anulado, false));
  const rubrosAll = await db.select().from(rubros);
  const rubMap = new Map(rubrosAll.map((r) => [r.id, r]));

  let movsFiltrados = movsAll.filter((m) => m.tipo !== 'transferencia');
  if (desde) movsFiltrados = movsFiltrados.filter((m) => m.fecha >= desde);
  if (hasta) movsFiltrados = movsFiltrados.filter((m) => m.fecha <= hasta);

  // Recibos de cuotas
  const recibosAll = await db.select().from(recibos).where(eq(recibos.anulado, false));
  let recibosFiltrados = recibosAll;
  if (desde) recibosFiltrados = recibosFiltrados.filter((r) => r.fecha >= desde);
  if (hasta) recibosFiltrados = recibosFiltrados.filter((r) => r.fecha <= hasta);
  const cobradoCuotas = recibosFiltrados.reduce((a, r) => a + r.total, 0);

  // Por rubro
  const porRubroMap = new Map<number | null, { nombre: string; tipo: string; monto: number }>();
  for (const m of movsFiltrados) {
    const rub = m.rubro_id ? rubMap.get(m.rubro_id) : null;
    const key = m.rubro_id;
    const existing = porRubroMap.get(key) || { nombre: rub?.nombre || 'Sin rubro', tipo: m.tipo, monto: 0 };
    existing.monto += m.importe;
    porRubroMap.set(key, existing);
  }

  const ingresos = Array.from(porRubroMap.values()).filter((r) => r.tipo === 'ingreso');
  const gastos = Array.from(porRubroMap.values()).filter((r) => r.tipo === 'gasto');

  // Agregar cuotas como ingreso
  ingresos.unshift({ nombre: 'Cuotas sociales', tipo: 'ingreso', monto: cobradoCuotas });

  const totalIngresos = ingresos.reduce((a, r) => a + r.monto, 0);
  const totalGastos = gastos.reduce((a, r) => a + r.monto, 0);

  // Serie mensual (últimos 12 meses)
  const hoy = new Date();
  const serieMensual = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1);
    const mes = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const meses = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
    const ing = movsAll.filter((m) => m.tipo === 'ingreso' && m.fecha.startsWith(mes)).reduce((a, m) => a + m.importe, 0)
      + recibosAll.filter((r) => r.fecha.startsWith(mes)).reduce((a, r) => a + r.total, 0);
    const gas = movsAll.filter((m) => m.tipo === 'gasto' && m.fecha.startsWith(mes)).reduce((a, m) => a + m.importe, 0);
    serieMensual.push({ mes, label: `${meses[d.getMonth()]} ${d.getFullYear()}`, ingresos: ing, gastos: gas });
  }

  // Saldos
  const cuentasAll = await db.select().from(cuentas);
  let plataEnCuentas = 0;
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
    for (const r of recibosAll) { if (r.cuenta_id === cuenta.id) s += r.total; }
    plataEnCuentas += s;
  }

  return { ingresos, gastos, totalIngresos, totalGastos, superavit: totalIngresos - totalGastos, plataEnCuentas, serieMensual };
}

export async function getReporteCobranza(desde?: string, hasta?: string) {
  // Cuotas por mes
  const cuotasAll = await db.select().from(cuotas).where(eq(cuotas.anulado, false));
  const hoy = new Date();
  const meses = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1);
    const mes = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const del = cuotasAll.filter((c) => c.periodo === mes);
    const emitido = del.reduce((a, c) => a + c.importe, 0);
    const cobrado = del.filter((c) => c.pagado).reduce((a, c) => a + c.importe, 0);
    const pct = emitido > 0 ? Math.round((cobrado / emitido) * 100) : 0;
    meses.push({ mes, emitido, cobrado, pct, qty_emitidas: del.length, qty_cobradas: del.filter((c) => c.pagado).length });
  }
  return { meses };
}

export async function getReporteMorosos() {
  const hoy = new Date().toISOString().split('T')[0];
  const cuotasVencidas = await db.select().from(cuotas).where(and(eq(cuotas.pagado, false), eq(cuotas.anulado, false)));
  const soloVencidas = cuotasVencidas.filter((c) => c.vence_en < hoy);
  const sociosAll = await db.select().from(socios).where(eq(socios.estado, 'activo'));
  const familiasAll = await db.select().from(familias);
  const famMap = new Map(familiasAll.map((f) => [f.id, f]));
  const socioMap = new Map(sociosAll.map((s) => [s.id, s]));

  const porFamilia = new Map<number, { monto: number; cantidad: number; masAntigua: string; nombre: string }>();
  for (const c of soloVencidas) {
    const socio = socioMap.get(c.socio_id);
    if (!socio) continue;
    const fid = socio.familia_id || -socio.id;
    const fam = socio.familia_id ? famMap.get(socio.familia_id) : null;
    const nombre = fam?.nombre || `${socio.apellido}, ${socio.nombre}`;
    const existing = porFamilia.get(fid) || { monto: 0, cantidad: 0, masAntigua: c.vence_en, nombre };
    existing.monto += c.importe;
    existing.cantidad++;
    if (c.vence_en < existing.masAntigua) existing.masAntigua = c.vence_en;
    porFamilia.set(fid, existing);
  }

  return Array.from(porFamilia.values()).sort((a, b) => b.monto - a.monto);
}

export async function getReporteSocios(mes?: string) {
  const target = mes || new Date().toISOString().slice(0, 7);
  const sociosAll = await db.select().from(socios);
  const hoy = new Date().toISOString().split('T')[0];
  const activos = sociosAll.filter((s) => s.estado === 'activo');
  const bajas = sociosAll.filter((s) => s.estado === 'baja');
  const vitalicos = sociosAll.filter((s) => s.estado === 'vitalicio');

  // Altas del mes
  const altas = sociosAll.filter((s) => s.creado_en?.startsWith(target)).length;
  const aptosVigentes = activos.filter((s) => s.vencimiento_apto && s.vencimiento_apto >= hoy).length;
  const aptosVencidos = activos.filter((s) => s.vencimiento_apto && s.vencimiento_apto < hoy).length;
  const sinApto = activos.filter((s) => !s.vencimiento_apto).length;

  return { total: sociosAll.length, activos: activos.length, bajas: bajas.length, vitalicos: vitalicos.length, altas, aptosVigentes, aptosVencidos, sinApto };
}

export async function exportarReportesExcel(tipo: string, desde?: string, hasta?: string) {
  const workbook = new ExcelJS.Workbook();
  if (tipo === 'ingresos-gastos' || tipo === 'todos') {
    const data = await getReporteIngresosGastos(desde, hasta);
    const sheet = workbook.addWorksheet('Ingresos y gastos');
    sheet.addRow(['Rubro', 'Tipo', 'Monto']);
    sheet.getRow(1).font = { bold: true };
    for (const r of [...data.ingresos, ...data.gastos]) sheet.addRow([r.nombre, r.tipo, r.monto]);
    sheet.addRow(['TOTAL INGRESOS', '', data.totalIngresos]);
    sheet.addRow(['TOTAL GASTOS', '', data.totalGastos]);
    sheet.addRow(['SUPERÁVIT', '', data.superavit]);
  }
  if (tipo === 'cobranza' || tipo === 'todos') {
    const data = await getReporteCobranza(desde, hasta);
    const sheet = workbook.addWorksheet('Cobranza');
    sheet.addRow(['Mes', 'Emitido', 'Cobrado', '% Cobrado', 'Cuotas emitidas', 'Cuotas cobradas']);
    sheet.getRow(1).font = { bold: true };
    for (const m of data.meses) sheet.addRow([m.mes, m.emitido, m.cobrado, m.pct, m.qty_emitidas, m.qty_cobradas]);
  }
  if (tipo === 'morosos' || tipo === 'todos') {
    const data = await getReporteMorosos();
    const sheet = workbook.addWorksheet('Morosos');
    sheet.addRow(['Familia / Socio', 'Monto deuda', 'Cuotas', 'Desde']);
    sheet.getRow(1).font = { bold: true };
    for (const m of data) sheet.addRow([m.nombre, m.monto, m.cantidad, m.masAntigua]);
  }
  if (tipo === 'socios' || tipo === 'todos') {
    const data = await getReporteSocios();
    const sheet = workbook.addWorksheet('Socios');
    sheet.addRow(['Concepto', 'Cantidad']);
    sheet.getRow(1).font = { bold: true };
    sheet.addRow(['Socios activos', data.activos]);
    sheet.addRow(['Bajas', data.bajas]);
    sheet.addRow(['Vitalicios', data.vitalicos]);
    sheet.addRow(['Aptos vigentes', data.aptosVigentes]);
    sheet.addRow(['Aptos vencidos', data.aptosVencidos]);
    sheet.addRow(['Sin apto', data.sinApto]);
  }
  return workbook;
}

