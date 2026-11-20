import { and, eq } from 'drizzle-orm';
import { db } from '../db/client.js';
import { movimientos, rubros } from '../db/schema.js';
import { Rubro, RubroInput, TipoRubro } from '@faronorte/shared';

export async function getRubrosService(
  soloActivos = false,
  tipo?: TipoRubro
): Promise<Rubro[]> {
  const rows = await db.select().from(rubros).all();

  let filtrados = rows;
  if (soloActivos) {
    filtrados = filtrados.filter((r) => r.activo);
  }
  if (tipo) {
    filtrados = filtrados.filter((r) => r.tipo === tipo);
  }

  return filtrados.map((r) => ({
    id: r.id,
    nombre: r.nombre,
    tipo: r.tipo as TipoRubro,
    privado: Boolean(r.privado),
    activo: Boolean(r.activo),
  }));
}

export async function createRubroService(input: RubroInput): Promise<Rubro> {
  const [insertado] = await db
    .insert(rubros)
    .values({
      nombre: input.nombre.trim(),
      tipo: input.tipo,
      privado: input.privado ?? false,
      activo: input.activo ?? true,
    })
    .returning();

  return {
    id: insertado.id,
    nombre: insertado.nombre,
    tipo: insertado.tipo as TipoRubro,
    privado: Boolean(insertado.privado),
    activo: Boolean(insertado.activo),
  };
}

export async function updateRubroService(
  id: number,
  input: Partial<RubroInput>
): Promise<Rubro> {
  const [existente] = await db.select().from(rubros).where(eq(rubros.id, id)).limit(1);
  if (!existente) {
    throw new Error('El rubro no existe');
  }

  const updates: Partial<typeof rubros.$inferInsert> = {};
  if (input.nombre !== undefined) updates.nombre = input.nombre.trim();
  if (input.tipo !== undefined) updates.tipo = input.tipo;
  if (input.privado !== undefined) updates.privado = input.privado;
  if (input.activo !== undefined) updates.activo = input.activo;

  const [actualizado] = await db
    .update(rubros)
    .set(updates)
    .where(eq(rubros.id, id))
    .returning();

  return {
    id: actualizado.id,
    nombre: actualizado.nombre,
    tipo: actualizado.tipo as TipoRubro,
    privado: Boolean(actualizado.privado),
    activo: Boolean(actualizado.activo),
  };
}

export async function deleteRubroService(
  id: number
): Promise<{ mensaje: string; desactiva: boolean }> {
  const [existente] = await db.select().from(rubros).where(eq(rubros.id, id)).limit(1);
  if (!existente) {
    throw new Error('El rubro no existe');
  }

  // Verificar si tiene movimientos asociados
  const tieneMovimientos = await db
    .select({ id: movimientos.id })
    .from(movimientos)
    .where(eq(movimientos.rubro_id, id))
    .limit(1);

  if (tieneMovimientos.length > 0) {
    // Si tiene movimientos, no se borra: se desactiva
    await db.update(rubros).set({ activo: false }).where(eq(rubros.id, id));
    return {
      mensaje: 'El rubro tiene movimientos registrados, por lo que fue desactivado.',
      desactiva: true,
    };
  }

  await db.delete(rubros).where(eq(rubros.id, id));
  return {
    mensaje: 'Rubro eliminado correctamente.',
    desactiva: false,
  };
}

