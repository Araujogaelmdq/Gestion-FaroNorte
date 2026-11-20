import { eq, sql, like, or, and } from 'drizzle-orm';
import { db } from '../db/client.js';
import { familias, socios, categorias } from '../db/schema.js';

export interface FamiliaDTO {
  id: number;
  nombre: string;
  responsable_nombre: string | null;
  responsable_dni: string | null;
  responsable_telefono: string | null;
  creado_en: string;
  cantidad_socios?: number;
}

export async function getFamiliasService(q?: string): Promise<FamiliaDTO[]> {
  const rows = await db.select().from(familias).orderBy(familias.nombre);
  let result = rows;
  if (q) {
    const lower = q.toLowerCase();
    result = rows.filter(
      (f) =>
        f.nombre.toLowerCase().includes(lower) ||
        (f.responsable_nombre || '').toLowerCase().includes(lower) ||
        (f.responsable_dni || '').includes(lower),
    );
  }

  // Contar socios activos por familia
  const sociosPorFamilia = await db
    .select({ familia_id: socios.familia_id, count: sql<number>`count(*)` })
    .from(socios)
    .where(eq(socios.estado, 'activo'))
    .groupBy(socios.familia_id);

  const countMap = new Map<number, number>();
  for (const row of sociosPorFamilia) {
    if (row.familia_id) countMap.set(row.familia_id, Number(row.count));
  }

  return result.map((f) => ({
    id: f.id,
    nombre: f.nombre,
    responsable_nombre: f.responsable_nombre,
    responsable_dni: f.responsable_dni,
    responsable_telefono: f.responsable_telefono,
    creado_en: f.creado_en,
    cantidad_socios: countMap.get(f.id) || 0,
  }));
}

export async function getFamiliaByIdService(id: number): Promise<FamiliaDTO & { socios: any[] }> {
  const [familia] = await db.select().from(familias).where(eq(familias.id, id)).limit(1);
  if (!familia) {
    const err: any = new Error('Familia no encontrada');
    err.statusCode = 404;
    throw err;
  }

  const sociosRows = await db
    .select({
      id: socios.id,
      numero: socios.numero,
      apellido: socios.apellido,
      nombre: socios.nombre,
      estado: socios.estado,
      categoria_id: socios.categoria_id,
    })
    .from(socios)
    .where(eq(socios.familia_id, id));

  return {
    id: familia.id,
    nombre: familia.nombre,
    responsable_nombre: familia.responsable_nombre,
    responsable_dni: familia.responsable_dni,
    responsable_telefono: familia.responsable_telefono,
    creado_en: familia.creado_en,
    socios: sociosRows,
  };
}

export async function createFamiliaService(input: {
  nombre: string;
  responsable_nombre?: string;
  responsable_dni?: string;
  responsable_telefono?: string;
}): Promise<FamiliaDTO> {
  const result = await db
    .insert(familias)
    .values({
      nombre: input.nombre,
      responsable_nombre: input.responsable_nombre || null,
      responsable_dni: input.responsable_dni || null,
      responsable_telefono: input.responsable_telefono || null,
    })
    .returning();
  const f = result[0];
  return { id: f.id, nombre: f.nombre, responsable_nombre: f.responsable_nombre, responsable_dni: f.responsable_dni, responsable_telefono: f.responsable_telefono, creado_en: f.creado_en };
}

export async function updateFamiliaService(
  id: number,
  input: { nombre?: string; responsable_nombre?: string; responsable_dni?: string; responsable_telefono?: string },
): Promise<FamiliaDTO> {
  const [existente] = await db.select().from(familias).where(eq(familias.id, id)).limit(1);
  if (!existente) {
    const err: any = new Error('Familia no encontrada');
    err.statusCode = 404;
    throw err;
  }

  await db
    .update(familias)
    .set({
      ...(input.nombre !== undefined ? { nombre: input.nombre } : {}),
      ...(input.responsable_nombre !== undefined ? { responsable_nombre: input.responsable_nombre } : {}),
      ...(input.responsable_dni !== undefined ? { responsable_dni: input.responsable_dni } : {}),
      ...(input.responsable_telefono !== undefined ? { responsable_telefono: input.responsable_telefono } : {}),
    })
    .where(eq(familias.id, id));

  const [updated] = await db.select().from(familias).where(eq(familias.id, id)).limit(1);
  return { id: updated.id, nombre: updated.nombre, responsable_nombre: updated.responsable_nombre, responsable_dni: updated.responsable_dni, responsable_telefono: updated.responsable_telefono, creado_en: updated.creado_en };
}

export async function moverSocioFamiliaService(socioId: number, nuevaFamiliaId: number | null): Promise<void> {
  await db.update(socios).set({ familia_id: nuevaFamiliaId }).where(eq(socios.id, socioId));
}

