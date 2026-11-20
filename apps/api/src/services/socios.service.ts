import { eq, sql, or, and, desc } from 'drizzle-orm';
import { db } from '../db/client.js';
import { socios, categorias, familias } from '../db/schema.js';

export interface SocioDTO {
  id: number;
  numero: number;
  apellido: string;
  nombre: string;
  nombre_completo: string;
  dni: string;
  nacimiento: string | null;
  edad: number | null;
  categoria_id: number | null;
  categoria_nombre: string | null;
  familia_id: number | null;
  familia_nombre: string | null;
  tutor: string | null;
  telefono: string | null;
  estado: string;
  vencimiento_apto: string | null;
  estado_apto: 'vigente' | 'vencido' | 'sin_apto';
  creado_en: string;
  actualizado_en: string | null;
}

function calcularEdad(nacimiento: string | null): number | null {
  if (!nacimiento) return null;
  const hoy = new Date();
  const nac = new Date(nacimiento);
  if (isNaN(nac.getTime())) return null;
  let edad = hoy.getFullYear() - nac.getFullYear();
  const m = hoy.getMonth() - nac.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) edad--;
  return edad;
}

function calcularEstadoApto(vencimiento: string | null): 'vigente' | 'vencido' | 'sin_apto' {
  if (!vencimiento) return 'sin_apto';
  const hoy = new Date();
  const venc = new Date(vencimiento);
  if (isNaN(venc.getTime())) return 'sin_apto';
  return venc >= hoy ? 'vigente' : 'vencido';
}

type SocioRow = typeof socios.$inferSelect;
type CatRow = typeof categorias.$inferSelect;
type FamRow = typeof familias.$inferSelect;

function mapSocio(
  s: SocioRow,
  cat: CatRow | undefined,
  fam: FamRow | undefined,
): SocioDTO {
  return {
    id: s.id,
    numero: s.numero,
    apellido: s.apellido,
    nombre: s.nombre,
    nombre_completo: `${s.apellido}, ${s.nombre}`,
    dni: s.dni,
    nacimiento: s.nacimiento,
    edad: calcularEdad(s.nacimiento),
    categoria_id: s.categoria_id,
    categoria_nombre: cat?.nombre || null,
    familia_id: s.familia_id,
    familia_nombre: fam?.nombre || null,
    tutor: s.tutor,
    telefono: s.telefono,
    estado: s.estado,
    vencimiento_apto: s.vencimiento_apto,
    estado_apto: calcularEstadoApto(s.vencimiento_apto),
    creado_en: s.creado_en,
    actualizado_en: s.actualizado_en,
  };
}

export async function listSociosService(filters?: {
  q?: string;
  categoria_id?: number;
  estado?: string;
  estado_apto?: string;
}): Promise<SocioDTO[]> {
  const rows = await db.select().from(socios).orderBy(socios.apellido, socios.nombre);
  const cats = await db.select().from(categorias);
  const fams = await db.select().from(familias);

  const catMap = new Map(cats.map((c) => [c.id, c]));
  const famMap = new Map(fams.map((f) => [f.id, f]));

  let result = rows.map((s) => mapSocio(s, catMap.get(s.categoria_id!), famMap.get(s.familia_id!)));

  if (filters?.q) {
    const lower = filters.q.toLowerCase();
    result = result.filter(
      (s) =>
        s.apellido.toLowerCase().includes(lower) ||
        s.nombre.toLowerCase().includes(lower) ||
        s.dni.includes(lower) ||
        String(s.numero).includes(lower) ||
        (s.familia_nombre || '').toLowerCase().includes(lower),
    );
  }
  if (filters?.categoria_id) {
    result = result.filter((s) => s.categoria_id === filters.categoria_id);
  }
  if (filters?.estado) {
    result = result.filter((s) => s.estado === filters.estado);
  }
  if (filters?.estado_apto) {
    result = result.filter((s) => s.estado_apto === filters.estado_apto);
  }

  return result;
}

export async function getSocioByIdService(id: number): Promise<SocioDTO> {
  const [s] = await db.select().from(socios).where(eq(socios.id, id)).limit(1);
  if (!s) {
    const err: any = new Error('Socio no encontrado');
    err.statusCode = 404;
    throw err;
  }
  const [cat] = s.categoria_id ? await db.select().from(categorias).where(eq(categorias.id, s.categoria_id)).limit(1) : [];
  const [fam] = s.familia_id ? await db.select().from(familias).where(eq(familias.id, s.familia_id)).limit(1) : [];
  return mapSocio(s, cat, fam);
}

export async function createSocioService(input: {
  apellido: string;
  nombre: string;
  dni: string;
  nacimiento?: string | null;
  categoria_id?: number | null;
  familia_id?: number | null;
  tutor?: string | null;
  telefono?: string | null;
  estado?: string;
  vencimiento_apto?: string | null;
}): Promise<SocioDTO> {
  // Verificar DNI único
  const existente = await db.select().from(socios).where(eq(socios.dni, input.dni)).limit(1);
  if (existente.length > 0) {
    const err: any = new Error('Ya existe un socio con ese DNI');
    err.statusCode = 400;
    throw err;
  }

  // Número correlativo
  const [maxRow] = await db.select({ max: sql<number>`MAX(numero)` }).from(socios);
  const numero = (Number(maxRow?.max) || 0) + 1;

  const result = await db
    .insert(socios)
    .values({
      numero,
      apellido: input.apellido,
      nombre: input.nombre,
      dni: input.dni,
      nacimiento: input.nacimiento || null,
      categoria_id: input.categoria_id || null,
      familia_id: input.familia_id || null,
      tutor: input.tutor || null,
      telefono: input.telefono || null,
      estado: (input.estado as any) || 'activo',
      vencimiento_apto: input.vencimiento_apto || null,
    })
    .returning();

  return getSocioByIdService(result[0].id);
}

export async function updateSocioService(
  id: number,
  input: Partial<{
    apellido: string;
    nombre: string;
    dni: string;
    nacimiento: string | null;
    categoria_id: number | null;
    familia_id: number | null;
    tutor: string | null;
    telefono: string | null;
    estado: string;
    vencimiento_apto: string | null;
  }>,
): Promise<SocioDTO> {
  const [existente] = await db.select().from(socios).where(eq(socios.id, id)).limit(1);
  if (!existente) {
    const err: any = new Error('Socio no encontrado');
    err.statusCode = 404;
    throw err;
  }

  // Verificar DNI único si se está cambiando
  if (input.dni && input.dni !== existente.dni) {
    const dniExiste = await db.select().from(socios).where(eq(socios.dni, input.dni)).limit(1);
    if (dniExiste.length > 0) {
      const err: any = new Error('Ya existe un socio con ese DNI');
      err.statusCode = 400;
      throw err;
    }
  }

  const ahora = new Date().toISOString();
  await db
    .update(socios)
    .set({ ...input, actualizado_en: ahora } as any)
    .where(eq(socios.id, id));

  return getSocioByIdService(id);
}

