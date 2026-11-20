import { FastifyInstance } from 'fastify';
import { clubSchema } from '@faronorte/shared';
import { requireAuth, requireRole } from '../middlewares/auth.middleware.js';
import { getClubService, updateClubService } from '../services/club.service.js';

export async function clubRoutes(fastify: FastifyInstance) {
  // GET /api/club (público o para cualquier usuario autenticado)
  fastify.get('/', async (_req, reply) => {
    try {
      const datosClub = await getClubService();
      return reply.send({ ok: true, club: datosClub });
    } catch (err: any) {
      return reply.status(500).send({
        error: 'Error del servidor',
        mensaje: err.message || 'No se pudieron obtener los datos del club',
      });
    }
  });

  // PUT /api/club (solo rol administrador)
  fastify.put(
    '/',
    { preHandler: [requireAuth, requireRole('administrador')] },
    async (req, reply) => {
      const parseResult = clubSchema.safeParse(req.body);
      if (!parseResult.success) {
        return reply.status(400).send({
          error: 'Datos inválidos',
          mensaje: parseResult.error.errors[0]?.message || 'Verificá los datos ingresados',
        });
      }

      try {
        const actualizado = await updateClubService(parseResult.data);
        return reply.send({
          ok: true,
          mensaje: 'Datos del club actualizados correctamente',
          club: actualizado,
        });
      } catch (err: any) {
        return reply.status(500).send({
          error: 'Error del servidor',
          mensaje: err.message || 'No se pudieron actualizar los datos del club',
        });
      }
    }
  );
}

