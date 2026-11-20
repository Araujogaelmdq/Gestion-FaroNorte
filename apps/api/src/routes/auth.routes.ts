import { FastifyInstance } from 'fastify';
import { requireAuth } from '../middlewares/auth.middleware.js';
import {
  checkLoginRateLimit,
  recordFailedLogin,
  resetLoginAttempts,
} from '../middlewares/rateLimit.js';
import { loginSchema, cambiarClaveSchema } from '../schemas/auth.schema.js';
import {
  cambiarClaveService,
  getMeService,
  loginService,
} from '../services/auth.service.js';

export async function authRoutes(fastify: FastifyInstance) {
  // POST /api/auth/login
  fastify.post('/login', async (req, reply) => {
    // 1. Verificar Rate limit
    if (!checkLoginRateLimit(req, reply)) {
      return;
    }

    // 2. Validar payload con Zod
    const parseResult = loginSchema.safeParse(req.body);
    if (!parseResult.success) {
      recordFailedLogin(req);
      return reply.status(400).send({
        error: 'Datos inválidos',
        mensaje: parseResult.error.errors[0]?.message || 'Verificá los datos ingresados',
      });
    }

    const { email, contrasena } = parseResult.data;

    try {
      const usuario = await loginService(email, contrasena);

      // Guardar en sesión
      req.session.user = {
        id: usuario.id,
        email: usuario.email,
        nombre: usuario.nombre,
        rol: usuario.rol,
        debe_cambiar_clave: usuario.debe_cambiar_clave,
      };

      resetLoginAttempts(req);

      return reply.send({
        ok: true,
        usuario,
      });
    } catch (err: any) {
      recordFailedLogin(req);
      const status = err.statusCode || 401;
      return reply.status(status).send({
        error: 'Error de autenticación',
        mensaje: err.message || 'No se pudo iniciar sesión',
      });
    }
  });

  // POST /api/auth/logout
  fastify.post('/logout', async (req, reply) => {
    if (req.session) {
      await new Promise<void>((resolve) => {
        req.session.destroy(() => {
          resolve();
        });
      });
    }
    reply.clearCookie('sessionId');
    return reply.send({
      ok: true,
      mensaje: 'Sesión cerrada correctamente',
    });
  });

  // GET /api/auth/me
  fastify.get('/me', { preHandler: requireAuth }, async (req, reply) => {
    try {
      const usuario = await getMeService(req.session.user!.id);
      return reply.send({
        ok: true,
        usuario,
      });
    } catch (err: any) {
      const status = err.statusCode || 500;
      return reply.status(status).send({
        error: 'Error al obtener usuario',
        mensaje: err.message,
      });
    }
  });

  // POST /api/auth/cambiar-clave
  fastify.post('/cambiar-clave', { preHandler: requireAuth }, async (req, reply) => {
    const parseResult = cambiarClaveSchema.safeParse(req.body);
    if (!parseResult.success) {
      return reply.status(400).send({
        error: 'Datos inválidos',
        mensaje: parseResult.error.errors[0]?.message || 'Verificá las contraseñas ingresadas',
      });
    }

    const { contrasenaActual, contrasenaNueva } = parseResult.data;

    try {
      const resultado = await cambiarClaveService(
        req.session.user!.id,
        contrasenaActual,
        contrasenaNueva,
      );

      // Actualizar flag en sesión
      if (req.session.user) {
        req.session.user.debe_cambiar_clave = false;
      }

      return reply.send({
        ok: true,
        mensaje: resultado.mensaje,
      });
    } catch (err: any) {
      const status = err.statusCode || 400;
      return reply.status(status).send({
        error: 'Error al cambiar contraseña',
        mensaje: err.message,
      });
    }
  });
}
