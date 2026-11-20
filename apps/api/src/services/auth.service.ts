import argon2 from 'argon2';
import { eq } from 'drizzle-orm';
import { db } from '../db/client.js';
import { usuarios } from '../db/schema.js';

export class AppError extends Error {
  statusCode: number;
  constructor(message: string, statusCode = 400) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
  }
}

export async function loginService(email: string, contrasena: string) {
  const [usuario] = await db
    .select()
    .from(usuarios)
    .where(eq(usuarios.email, email.toLowerCase().trim()))
    .limit(1);

  if (!usuario) {
    throw new AppError('Credenciales incorrectas', 401);
  }

  if (!usuario.activo) {
    throw new AppError('Tu usuario está deshabilitado. Hablá con el administrador.', 403);
  }

  const claveValida = await argon2.verify(usuario.contrasena_hash, contrasena);
  if (!claveValida) {
    throw new AppError('Credenciales incorrectas', 401);
  }

  return {
    id: usuario.id,
    email: usuario.email,
    nombre: usuario.nombre,
    rol: usuario.rol,
    activo: usuario.activo,
    debe_cambiar_clave: usuario.debe_cambiar_clave,
  };
}

export async function getMeService(userId: number) {
  const [usuario] = await db.select().from(usuarios).where(eq(usuarios.id, userId)).limit(1);

  if (!usuario) {
    throw new AppError('Usuario no encontrado', 404);
  }

  if (!usuario.activo) {
    throw new AppError('Usuario inactivo', 403);
  }

  return {
    id: usuario.id,
    email: usuario.email,
    nombre: usuario.nombre,
    rol: usuario.rol,
    activo: usuario.activo,
    debe_cambiar_clave: usuario.debe_cambiar_clave,
  };
}

export async function cambiarClaveService(
  userId: number,
  contrasenaActual?: string,
  contrasenaNueva?: string,
) {
  if (!contrasenaNueva || contrasenaNueva.length < 8) {
    throw new AppError('La nueva contraseña debe tener al menos 8 caracteres', 400);
  }

  const [usuario] = await db.select().from(usuarios).where(eq(usuarios.id, userId)).limit(1);
  if (!usuario) {
    throw new AppError('Usuario no encontrado', 404);
  }

  // Si no está obligado a cambiar la clave, debe ingresar su clave actual
  if (!usuario.debe_cambiar_clave) {
    if (!contrasenaActual) {
      throw new AppError('Debés ingresar tu contraseña actual', 400);
    }
    const actualValida = await argon2.verify(usuario.contrasena_hash, contrasenaActual);
    if (!actualValida) {
      throw new AppError('La contraseña actual es incorrecta', 400);
    }
  }

  const nuevoHash = await argon2.hash(contrasenaNueva);

  await db
    .update(usuarios)
    .set({
      contrasena_hash: nuevoHash,
      debe_cambiar_clave: false,
    })
    .where(eq(usuarios.id, userId));

  return { exito: true, mensaje: 'Contraseña actualizada correctamente' };
}
