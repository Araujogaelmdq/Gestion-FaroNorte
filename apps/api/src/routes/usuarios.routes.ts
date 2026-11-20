import { FastifyInstance } from 'fastify';
import { requireAuth, requireRole } from '../middlewares/auth.middleware.js';
import {
  createUsuarioService,
  generarContrasenaService,
  getUsuariosService,
  updateUsuarioService,
} from '../services/usuarios.service.js';

export async function usuariosRoutes(fastify: FastifyInstance) {
  // GET /api/usuarios
  fastify.get('/', { preHandler: [requireAuth, requireRole('administrador')] }, async (req, reply) => {
    const lista = await getUsuariosService();
    return reply.send({ ok: true, usuarios: lista });
  });

  // POST /api/usuarios
  fastify.post('/', { preHandler: [requireAuth, requireRole('administrador')] }, async (req, reply) => {
    const body = req.body as any;
    if (!body?.email || !body?.nombre || !body?.rol) {
      return reply.status(400).send({ error: 'Datos inválidos', mensaje: 'Email, nombre y rol son obligatorios' });
    }
    if (!['administrador', 'tesorero', 'secretario', 'profe'].includes(body.rol)) {
      return reply.status(400).send({ error: 'Rol inválido', mensaje: 'El rol debe ser administrador, tesorero, secretario o profe' });
    }

    // Generar contraseña temporal
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let clave = '';
    for (let i = 0; i < 12; i++) {
      clave += chars[Math.floor(Math.random() * chars.length)];
    }

    try {
      const resultado = await createUsuarioService({
        email: body.email,
        nombre: body.nombre,
        rol: body.rol,
        contrasena: clave,
      });
      return reply.status(201).send({ ok: true, usuario: resultado, contrasena_temporal: clave });
    } catch (err: any) {
      return reply.status(err.statusCode || 500).send({ error: 'Error al crear usuario', mensaje: err.message });
    }
  });

  // PUT /api/usuarios/:id
  fastify.put('/:id', { preHandler: [requireAuth, requireRole('administrador')] }, async (req, reply) => {
    const id = parseInt((req.params as any).id);
    if (isNaN(id)) return reply.status(400).send({ error: 'ID inválido' });

    const body = req.body as any;
    // No permitir editar al propio usuario (para evitar desbloqueos)
    if (id === req.session.user!.id && body.activo === false) {
      return reply.status(400).send({ error: 'No podés desactivar tu propio usuario' });
    }

    try {
      const updated = await updateUsuarioService(id, {
        nombre: body.nombre,
        rol: body.rol,
        activo: body.activo,
      });
      return reply.send({ ok: true, usuario: updated });
    } catch (err: any) {
      return reply.status(err.statusCode || 500).send({ error: 'Error al actualizar usuario', mensaje: err.message });
    }
  });

  // POST /api/usuarios/:id/generar-clave
  fastify.post('/:id/generar-clave', { preHandler: [requireAuth, requireRole('administrador')] }, async (req, reply) => {
    const id = parseInt((req.params as any).id);
    if (isNaN(id)) return reply.status(400).send({ error: 'ID inválido' });

    try {
      const clave = await generarContrasenaService(id);
      return reply.send({ ok: true, contrasena_temporal: clave });
    } catch (err: any) {
      return reply.status(err.statusCode || 500).send({ error: 'Error al generar contraseña', mensaje: err.message });
    }
  });
}

