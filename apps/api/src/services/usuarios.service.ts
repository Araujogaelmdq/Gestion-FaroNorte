import { eq } from 'drizzle-orm';
import { db } from '../db/client.js';
import { usuarios } from '../db/schema.js';
import argon2 from 'argon2';

export interface UsuarioDTO {
  id: number;
  email: string;
  nombre: string;
  rol: string;
  activo: boolean;
  debe_cambiar_clave: boolean;
  creado_en: string;
}

function mapUsuario(u: typeof usuarios.$inferSelect): UsuarioDTO {
  return {
    id: u.id,
    email: u.email,
    nombre: u.nombre,
    rol: u.rol,
    activo: u.activo,
    debe_cambiar_clave: u.debe_cambiar_clave,
    creado_en: u.creado_en,
  };
}

export async function getUsuariosService(): Promise<UsuarioDTO[]> {
  const rows = await db.select().from(usuarios).orderBy(usuarios.nombre);
  return rows.map(mapUsuario);
}

export async function createUsuarioService(input: {
  email: string;
  nombre: string;
  rol: string;
  contrasena: string;
}): Promise<UsuarioDTO & { contrasena_temporal: string }> {
  // Verificar email único
  const existente = await db.select().from(usuarios).where(eq(usuarios.email, input.email)).limit(1);
  if (existente.length > 0) {
    const err: any = new Error('Ya existe un usuario con ese correo electrónico');
    err.statusCode = 400;
    throw err;
  }

  const hash = await argon2.hash(input.contrasena);
  const result = await db
    .insert(usuarios)
    .values({
      email: input.email,
      nombre: input.nombre,
      rol: input.rol,
      contrasena_hash: hash,
      activo: true,
      debe_cambiar_clave: true,
    })
    .returning();

  const nuevo = result[0];
  return { ...mapUsuario(nuevo), contrasena_temporal: input.contrasena };
}

export async function updateUsuarioService(
  id: number,
  input: { nombre?: string; rol?: string; activo?: boolean },
): Promise<UsuarioDTO> {
  const existente = await db.select().from(usuarios).where(eq(usuarios.id, id)).limit(1);
  if (existente.length === 0) {
    const err: any = new Error('Usuario no encontrado');
    err.statusCode = 404;
    throw err;
  }

  await db
    .update(usuarios)
    .set({
      ...(input.nombre !== undefined ? { nombre: input.nombre } : {}),
      ...(input.rol !== undefined ? { rol: input.rol } : {}),
      ...(input.activo !== undefined ? { activo: input.activo } : {}),
    })
    .where(eq(usuarios.id, id));

  const [updated] = await db.select().from(usuarios).where(eq(usuarios.id, id)).limit(1);
  return mapUsuario(updated);
}

export async function generarContrasenaService(id: number): Promise<string> {
  const existente = await db.select().from(usuarios).where(eq(usuarios.id, id)).limit(1);
  if (existente.length === 0) {
    const err: any = new Error('Usuario no encontrado');
    err.statusCode = 404;
    throw err;
  }

  // Generar contraseña temporal aleatoria (12 chars)
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let clave = '';
  for (let i = 0; i < 12; i++) {
    clave += chars[Math.floor(Math.random() * chars.length)];
  }

  const hash = await argon2.hash(clave);
  await db
    .update(usuarios)
    .set({ contrasena_hash: hash, debe_cambiar_clave: true })
    .where(eq(usuarios.id, id));

  return clave;
}

