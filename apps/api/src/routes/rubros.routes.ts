import { FastifyInstance } from 'fastify';
import { rubroSchema, TipoRubro } from '@faronorte/shared';
import { requireAuth, requireRole } from '../middlewares/auth.middleware.js';
import {
  createRubroService,
  deleteRubroService,
  getRubrosService,
  updateRubroService,
} from '../services/rubros.service.js';

export async function rubrosRoutes(fastify: FastifyInstance) {
  // GET /api/rubros
  fastify.get('/', { preHandler: [requireAuth] }, async (req, reply) => {
    try {
      const query = req.query as { soloActivos?: string; tipo?: TipoRubro };
      const soloActivos = query.soloActivos === 'true';
      const lista = await getRubrosService(soloActivos, query.tipo);
      return reply.send({ ok: true, rubros: lista });
    } catch (err: any) {
      return reply.status(500).send({
        error: 'Error del servidor',
        mensaje: err.message || 'No se pudieron listar los rubros',
      });
    }
  });

  // POST /api/rubros (solo rol administrador)
  fastify.post(
    '/',
    { preHandler: [requireAuth, requireRole('administrador')] },
    async (req, reply) => {
      const parseResult = rubroSchema.safeParse(req.body);
      if (!parseResult.success) {
        return reply.status(400).send({
          error: 'Datos inválidos',
          mensaje: parseResult.error.errors[0]?.message || 'Verificá los datos ingresados',
        });
      }

      try {
        const creado = await createRubroService(parseResult.data);
        return reply.status(201).send({
          ok: true,
          mensaje: 'Rubro creado con éxito',
          rubro: creado,
        });
      } catch (err: any) {
        return reply.status(500).send({
          error: 'Error del servidor',
          mensaje: err.message || 'No se pudo crear el rubro',
        });
      }
    }
  );

  // PUT /api/rubros/:id (solo rol administrador)
  fastify.put(
    '/:id',
    { preHandler: [requireAuth, requireRole('administrador')] },
    async (req, reply) => {
      const { id } = req.params as { id: string };
      const rubroId = parseInt(id, 10);
      if (isNaN(rubroId)) {
        return reply.status(400).send({ error: 'ID inválido', mensaje: 'El ID debe ser numérico' });
      }

      const parseResult = rubroSchema.partial().safeParse(req.body);
      if (!parseResult.success) {
        return reply.status(400).send({
          error: 'Datos inválidos',
          mensaje: parseResult.error.errors[0]?.message || 'Verificá los datos ingresados',
        });
      }

      try {
        const actualizado = await updateRubroService(rubroId, parseResult.data);
        return reply.send({
          ok: true,
          mensaje: 'Rubro actualizado correctamente',
          rubro: actualizado,
        });
      } catch (err: any) {
        return reply.status(400).send({
          error: 'Error en la actualización',
          mensaje: err.message || 'No se pudo actualizar el rubro',
        });
      }
    }
  );

  // DELETE /api/rubros/:id (solo rol administrador)
  fastify.delete(
    '/:id',
    { preHandler: [requireAuth, requireRole('administrador')] },
    async (req, reply) => {
      const { id } = req.params as { id: string };
      const rubroId = parseInt(id, 10);
      if (isNaN(rubroId)) {
        return reply.status(400).send({ error: 'ID inválido', mensaje: 'El ID debe ser numérico' });
      }

      try {
        const resultado = await deleteRubroService(rubroId);
        return reply.send({ ok: true, ...resultado });
      } catch (err: any) {
        return reply.status(400).send({
          error: 'Error al eliminar',
          mensaje: err.message || 'No se pudo eliminar el rubro',
        });
      }
    }
  );
}

