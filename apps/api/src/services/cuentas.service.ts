import { eq, or } from 'drizzle-orm';
import { db } from '../db/client.js';
import { cuentas, movimientos, recibos } from '../db/schema.js';
import { Cuenta, CuentaInput } from '@faronorte/shared';

export async function getCuentasService(soloActivas = false): Promise<Cuenta[]> {
  const rows = await db.select().from(cuentas).all();
  const filtradas = soloActivas ? rows.filter((c) => c.activa) : rows;

  return filtradas.map((c) => ({
    id: c.id,
    nombre: c.nombre,
    saldo_inicial: c.saldo_inicial,
    activa: Boolean(c.activa),
  }));
}

export async function createCuentaService(input: CuentaInput): Promise<Cuenta> {
  const [insertada] = await db
    .insert(cuentas)
    .values({
      nombre: input.nombre.trim(),
      saldo_inicial: Math.round(input.saldo_inicial || 0),
      activa: input.activa ?? true,
    })
    .returning();

  return {
    id: insertada.id,
    nombre: insertada.nombre,
    saldo_inicial: insertada.saldo_inicial,
    activa: Boolean(insertada.activa),
  };
}

export async function updateCuentaService(
  id: number,
  input: Partial<CuentaInput>
): Promise<Cuenta> {
  const [existente] = await db.select().from(cuentas).where(eq(cuentas.id, id)).limit(1);
  if (!existente) {
    throw new Error('La cuenta no existe');
  }

  const updates: Partial<typeof cuentas.$inferInsert> = {};
  if (input.nombre !== undefined) updates.nombre = input.nombre.trim();
  if (input.saldo_inicial !== undefined) updates.saldo_inicial = Math.round(input.saldo_inicial);
  if (input.activa !== undefined) updates.activa = input.activa;

  const [actualizada] = await db
    .update(cuentas)
    .set(updates)
    .where(eq(cuentas.id, id))
    .returning();

  return {
    id: actualizada.id,
    nombre: actualizada.nombre,
    saldo_inicial: actualizada.saldo_inicial,
    activa: Boolean(actualizada.activa),
  };
}

export async function deleteCuentaService(
  id: number
): Promise<{ mensaje: string; desactiva: boolean }> {
  const [existente] = await db.select().from(cuentas).where(eq(cuentas.id, id)).limit(1);
  if (!existente) {
    throw new Error('La cuenta no existe');
  }

  // Verificar si tiene movimientos o recibos asociados
  const tieneMovimientos = await db
    .select({ id: movimientos.id })
    .from(movimientos)
    .where(or(eq(movimientos.cuenta_origen_id, id), eq(movimientos.cuenta_destino_id, id)))
    .limit(1);

  const tieneRecibos = await db
    .select({ id: recibos.id })
    .from(recibos)
    .where(eq(recibos.cuenta_id, id))
    .limit(1);

  if (tieneMovimientos.length > 0 || tieneRecibos.length > 0) {
    // Si tiene movimientos o recibos, no se borra: solo se desactiva
    await db.update(cuentas).set({ activa: false }).where(eq(cuentas.id, id));
    return {
      mensaje: 'La cuenta tiene movimientos o cobros registrados, por lo que fue desactivada.',
      desactiva: true,
    };
  }

  await db.delete(cuentas).where(eq(cuentas.id, id));
  return {
    mensaje: 'Cuenta eliminada correctamente.',
    desactiva: false,
  };
}

