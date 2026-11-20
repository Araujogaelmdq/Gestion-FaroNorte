import { FastifyInstance } from 'fastify';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { getInicioDashboard } from '../services/inicio.service.js';

export async function inicioRoutes(fastify: FastifyInstance) {
  fastify.get('/', { preHandler: requireAuth }, async (req, reply) => {
    const datos = await getInicioDashboard();
    return reply.send({ ok: true, ...datos });
  });
}

