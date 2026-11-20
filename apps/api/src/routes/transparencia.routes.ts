import { FastifyInstance } from 'fastify';
import { requireAuth, requireRole } from '../middlewares/auth.middleware.js';
import {
  getTransparenciaConfig,
  getTransparenciaPublica,
  saveTransparenciaConfig,
} from '../services/transparencia.service.js';

export async function transparenciaRoutes(fastify: FastifyInstance) {
  // GET /api/transparencia/config (admin)
  fastify.get('/config', { preHandler: [requireAuth, requireRole('administrador')] }, async (req, reply) => {
    const config = getTransparenciaConfig();
    return reply.send({ ok: true, config });
  });

  // PUT /api/transparencia/config (admin)
  fastify.put('/config', { preHandler: [requireAuth, requireRole('administrador')] }, async (req, reply) => {
    const updated = saveTransparenciaConfig(req.body as any);
    return reply.send({ ok: true, config: updated });
  });
}

export async function transparenciaPublicaRoutes(fastify: FastifyInstance) {
  // GET /api/publico/transparencia (SIN auth — pública)
  fastify.get('/transparencia', async (req, reply) => {
    const datos = await getTransparenciaPublica();
    return reply.send(datos);
  });
}

