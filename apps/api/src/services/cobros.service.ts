import { eq, sql, and, gte, lte, desc } from 'drizzle-orm';
import { db } from '../db/client.js';
import { recibos, recibo_items, cuotas, socios, familias, cuentas, usuarios, club } from '../db/schema.js';

export interface ReciboDTO {
  id: number;
  numero: number;
  familia_id: number | null;
  familia_nombre: string | null;
  usuario_nombre: string;
  fecha: string;
  total: number;
  medio_pago: string;
  cuenta_nombre: string | null;
  anulado: boolean;
  motivo_anulacion: string | null;
  items: { cuota_id: number; periodo: string; importe: number }[];
  creado_en: string;
}

export async function buscarFamiliaParaCobro(q: string) {
  const sociosAll = await db.select().from(socios);
  const familiasAll = await db.select().from(familias);
  const famMap = new Map(familiasAll.map((f) => [f.id, f]));

  const lower = q.toLowerCase();
  const coinciden = sociosAll.filter(
    (s) =>
      s.apellido.toLowerCase().includes(lower) ||
      s.nombre.toLowerCase().includes(lower) ||
      s.dni.includes(lower),
  );

  // Agrupar por familia, deduplicar
  const familiasEncontradas = new Map<number, any>();
  for (const s of coinciden) {
    const fid = s.familia_id || -s.id; // Sin familia → clave negativa
    if (!familiasEncontradas.has(fid)) {
      const fam = s.familia_id ? famMap.get(s.familia_id) : null;
      familiasEncontradas.set(fid, {
        familia_id: s.familia_id,
        familia_nombre: fam?.nombre || `${s.apellido}, ${s.nombre}`,
        responsable_telefono: fam?.responsable_telefono || s.telefono,
        socios: [],
      });
    }
    familiasEncontradas.get(fid)!.socios.push({ id: s.id, nombre: `${s.apellido}, ${s.nombre}`, estado: s.estado });
  }

  return Array.from(familiasEncontradas.values()).slice(0, 10);
}

export async function getCuotasPendientesFamilia(familiaId: number) {
  const sociosFam = await db.select().from(socios).where(eq(socios.familia_id, familiaId));
  const socioIds = sociosFam.map((s) => s.id);
  if (socioIds.length === 0) return [];

  const pendientes = [];
  for (const sid of socioIds) {
    const rows = await db
      .select()
      .from(cuotas)
      .where(and(eq(cuotas.socio_id, sid), eq(cuotas.pagado, false), eq(cuotas.anulado, false)));
    const socio = sociosFam.find((s) => s.id === sid)!;
    for (const c of rows) {
      pendientes.push({ ...c, socio_apellido: socio.apellido, socio_nombre: socio.nombre });
    }
  }
  // Ordenar: vencidas primero
  return pendientes.sort((a, b) => a.vence_en.localeCompare(b.vence_en));
}

export async function cobrarFamilia(input: {
  familia_id: number | null;
  cuota_ids: number[];
  importe: number;
  medio_pago: string;
  cuenta_id: number;
  usuario_id: number;
}): Promise<ReciboDTO> {
  const hoy = new Date().toISOString().split('T')[0];

  // Número correlativo de recibo
  const [maxRow] = await db.select({ max: sql<number>`MAX(numero)` }).from(recibos);
  const numero = (Number(maxRow?.max) || 0) + 1;

  // Calcular total real de las cuotas seleccionadas
  let totalCuotas = 0;
  const cuotasSeleccionadas = [];
  for (const id of input.cuota_ids) {
    const [c] = await db.select().from(cuotas).where(eq(cuotas.id, id)).limit(1);
    if (c && !c.pagado && !c.anulado) {
      cuotasSeleccionadas.push(c);
      totalCuotas += c.importe;
    }
  }

  const total = Math.min(input.importe, totalCuotas);

  // Crear recibo
  const [recibo] = await db
    .insert(recibos)
    .values({
      numero,
      familia_id: input.familia_id,
      usuario_id: input.usuario_id,
      fecha: hoy,
      total,
      medio_pago: input.medio_pago,
      cuenta_id: input.cuenta_id,
      anulado: false,
    })
    .returning();

  // Crear items y marcar cuotas pagadas
  for (const c of cuotasSeleccionadas) {
    await db.insert(recibo_items).values({
      recibo_id: recibo.id,
      cuota_id: c.id,
      importe: c.importe,
    });
    await db.update(cuotas).set({ pagado: true, pagado_en: hoy, recibo_id: recibo.id }).where(eq(cuotas.id, c.id));
  }

  return getReciboById(recibo.id);
}

export async function getReciboById(id: number): Promise<ReciboDTO> {
  const [r] = await db.select().from(recibos).where(eq(recibos.id, id)).limit(1);
  if (!r) { const e: any = new Error('Recibo no encontrado'); e.statusCode = 404; throw e; }

  const items = await db.select().from(recibo_items).where(eq(recibo_items.recibo_id, id));
  const cuotasItems = [];
  for (const item of items) {
    const [c] = await db.select().from(cuotas).where(eq(cuotas.id, item.cuota_id)).limit(1);
    if (c) cuotasItems.push({ cuota_id: c.id, periodo: c.periodo, importe: item.importe });
  }

  const [usuario] = await db.select().from(usuarios).where(eq(usuarios.id, r.usuario_id)).limit(1);
  const familia = r.familia_id ? (await db.select().from(familias).where(eq(familias.id, r.familia_id)).limit(1))[0] : null;
  const cuenta = r.cuenta_id ? (await db.select().from(cuentas).where(eq(cuentas.id, r.cuenta_id)).limit(1))[0] : null;

  return {
    id: r.id,
    numero: r.numero,
    familia_id: r.familia_id,
    familia_nombre: familia?.nombre || null,
    usuario_nombre: usuario?.nombre || '',
    fecha: r.fecha,
    total: r.total,
    medio_pago: r.medio_pago,
    cuenta_nombre: cuenta?.nombre || null,
    anulado: r.anulado,
    motivo_anulacion: r.motivo_anulacion,
    items: cuotasItems,
    creado_en: r.creado_en,
  };
}

export async function getRecibos(filters: { desde?: string; hasta?: string }) {
  const rows = await db.select().from(recibos).orderBy(desc(recibos.id));
  let result = rows;
  if (filters.desde) result = result.filter((r) => r.fecha >= filters.desde!);
  if (filters.hasta) result = result.filter((r) => r.fecha <= filters.hasta!);

  const familiasAll = await db.select().from(familias);
  const famMap = new Map(familiasAll.map((f) => [f.id, f]));
  const usuariosAll = await db.select().from(usuarios);
  const usrMap = new Map(usuariosAll.map((u) => [u.id, u]));

  return result.map((r) => ({
    id: r.id,
    numero: r.numero,
    familia_nombre: r.familia_id ? famMap.get(r.familia_id)?.nombre || null : null,
    usuario_nombre: usrMap.get(r.usuario_id)?.nombre || '',
    fecha: r.fecha,
    total: r.total,
    medio_pago: r.medio_pago,
    anulado: r.anulado,
    creado_en: r.creado_en,
  }));
}

export async function anularRecibo(id: number, motivo: string): Promise<void> {
  const [r] = await db.select().from(recibos).where(eq(recibos.id, id)).limit(1);
  if (!r) { const e: any = new Error('Recibo no encontrado'); e.statusCode = 404; throw e; }
  if (r.anulado) { const e: any = new Error('El recibo ya está anulado'); e.statusCode = 400; throw e; }

  await db.update(recibos).set({ anulado: true, motivo_anulacion: motivo }).where(eq(recibos.id, id));

  // Desmarcar cuotas como pagadas
  const items = await db.select().from(recibo_items).where(eq(recibo_items.recibo_id, id));
  for (const item of items) {
    await db.update(cuotas).set({ pagado: false, pagado_en: null, recibo_id: null }).where(eq(cuotas.id, item.cuota_id));
  }
}

