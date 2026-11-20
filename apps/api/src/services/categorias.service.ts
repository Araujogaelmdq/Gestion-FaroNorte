import { eq } from 'drizzle-orm';
import { db } from '../db/client.js';
import { categorias, socios } from '../db/schema.js';
import { Categoria, CategoriaInput } from '@faronorte/shared';

export async function getCategoriasService(soloActivas = false): Promise<Categoria[]> {
  const query = db.select().from(categorias);
  const rows = await query.all();

  const filtradas = soloActivas ? rows.filter((c) => c.activa) : rows;

  return filtradas.map((c) => ({
    id: c.id,
    nombre: c.nombre,
    valor_cuota_centavos: c.valor_cuota_centavos,
    activa: Boolean(c.activa),
  }));
}

export async function createCategoriaService(input: CategoriaInput): Promise<Categoria> {
  const [insertada] = await db
    .insert(categorias)
    .values({
      nombre: input.nombre.trim(),
      valor_cuota_centavos: Math.round(input.valor_cuota_centavos),
      activa: input.activa ?? true,
    })
    .returning();

  return {
    id: insertada.id,
    nombre: insertada.nombre,
    valor_cuota_centavos: insertada.valor_cuota_centavos,
    activa: Boolean(insertada.activa),
  };
}

export async function updateCategoriaService(
  id: number,
  input: Partial<CategoriaInput>
): Promise<Categoria> {
  const [existente] = await db.select().from(categorias).where(eq(categorias.id, id)).limit(1);
  if (!existente) {
    throw new Error('La categoría no existe');
  }

  const updates: Partial<typeof categorias.$inferInsert> = {};
  if (input.nombre !== undefined) updates.nombre = input.nombre.trim();
  if (input.valor_cuota_centavos !== undefined)
    updates.valor_cuota_centavos = Math.round(input.valor_cuota_centavos);
  if (input.activa !== undefined) updates.activa = input.activa;

  const [actualizada] = await db
    .update(categorias)
    .set(updates)
    .where(eq(categorias.id, id))
    .returning();

  return {
    id: actualizada.id,
    nombre: actualizada.nombre,
    valor_cuota_centavos: actualizada.valor_cuota_centavos,
    activa: Boolean(actualizada.activa),
  };
}

export async function deleteCategoriaService(id: number): Promise<{ mensaje: string; desactiva: boolean }> {
  const [existente] = await db.select().from(categorias).where(eq(categorias.id, id)).limit(1);
  if (!existente) {
    throw new Error('La categoría no existe');
  }

  // Verificar si hay socios con esta categoría
  const sociosConCategoria = await db
    .select({ id: socios.id })
    .from(socios)
    .where(eq(socios.categoria_id, id))
    .limit(1);

  if (sociosConCategoria.length > 0) {
    // Si tiene socios, no se elimina físicamente: se desactiva
    await db.update(categorias).set({ activa: false }).where(eq(categorias.id, id));
    return {
      mensaje: 'La categoría tiene socios asignados, por lo que fue desactivada.',
      desactiva: true,
    };
  }

  // Si no tiene socios, se puede eliminar
  await db.delete(categorias).where(eq(categorias.id, id));
  return {
    mensaje: 'Categoría eliminada correctamente.',
    desactiva: false,
  };
}

