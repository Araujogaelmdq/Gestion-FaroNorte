import { FastifyInstance } from 'fastify';
import { cuentaSchema } from '@faronorte/shared';
import { requireAuth, requireRole } from '../middlewares/auth.middleware.js';
import {
  createCuentaService,
  deleteCuentaService,
  getCuentasService,
  updateCuentaService,
} from '../services/cuentas.service.js';

export async function cuentasRoutes(fastify: FastifyInstance) {
  // GET /api/cuentas
  fastify.get('/', { preHandler: [requireAuth] }, async (req, reply) => {
    try {
      const query = req.query as { soloActivas?: string };
      const soloActivas = query.soloActivas === 'true';
      const lista = await getCuentasService(soloActivas);
      return reply.send({ ok: true, cuentas: lista });
    } catch (err: any) {
      return reply.status(500).send({
        error: 'Error del servidor',
        mensaje: err.message || 'No se pudieron listar las cuentas',
      });
    }
  });

  // POST /api/cuentas (solo rol administrador)
  fastify.post(
    '/',
    { preHandler: [requireAuth, requireRole('administrador')] },
    async (req, reply) => {
      const parseResult = cuentaSchema.safeParse(req.body);
      if (!parseResult.success) {
        return reply.status(400).send({
          error: 'Datos inválidos',
          mensaje: parseResult.error.errors[0]?.message || 'Verificá los datos ingresados',
        });
      }

      try {
        const creada = await createCuentaService(parseResult.data);
        return reply.status(201).send({
          ok: true,
          mensaje: 'Cuenta creada con éxito',
          cuenta: creada,
        });
      } catch (err: any) {
        return reply.status(500).send({
          error: 'Error del servidor',
          mensaje: err.message || 'No se pudo crear la cuenta',
        });
      }
    }
  );

  // PUT /api/cuentas/:id (solo rol administrador)
  fastify.put(
    '/:id',
    { preHandler: [requireAuth, requireRole('administrador')] },
    async (req, reply) => {
      const { id } = req.params as { id: string };
      const cuentaId = parseInt(id, 10);
      if (isNaN(cuentaId)) {
        return reply.status(400).send({ error: 'ID inválido', mensaje: 'El ID debe ser numérico' });
      }

      const parseResult = cuentaSchema.partial().safeParse(req.body);
      if (!parseResult.success) {
        return reply.status(400).send({
          error: 'Datos inválidos',
          mensaje: parseResult.error.errors[0]?.message || 'Verificá los datos ingresados',
        });
      }

      try {
        const actualizada = await updateCuentaService(cuentaId, parseResult.data);
        return reply.send({
          ok: true,
          mensaje: 'Cuenta actualizada correctamente',
          cuenta: actualizada,
        });
      } catch (err: any) {
        return reply.status(400).send({
          error: 'Error en la actualización',
          mensaje: err.message || 'No se pudo actualizar la cuenta',
        });
      }
    }
  );

  // DELETE /api/cuentas/:id (solo rol administrador)
  fastify.delete(
    '/:id',
    { preHandler: [requireAuth, requireRole('administrador')] },
    async (req, reply) => {
      const { id } = req.params as { id: string };
      const cuentaId = parseInt(id, 10);
      if (isNaN(cuentaId)) {
        return reply.status(400).send({ error: 'ID inválido', mensaje: 'El ID debe ser numérico' });
      }

      try {
        const resultado = await deleteCuentaService(cuentaId);
        return reply.send({ ok: true, ...resultado });
      } catch (err: any) {
        return reply.status(400).send({
          error: 'Error al eliminar',
          mensaje: err.message || 'No se pudo eliminar la cuenta',
        });
      }
    }
  );
}

