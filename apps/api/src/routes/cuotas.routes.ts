import { FastifyInstance } from 'fastify';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { getCuotasEstadoMes, generarCuotasMes, getFamiliaDeudas } from '../services/cuotas.service.js';

export async function cuotasRoutes(fastify: FastifyInstance) {
  // GET /api/cuotas/estado/:periodo  (YYYY-MM)
  fastify.get('/estado/:periodo', { preHandler: requireAuth }, async (req, reply) => {
    const { periodo } = req.params as any;
    if (!/^\d{4}-\d{2}$/.test(periodo)) return reply.status(400).send({ error: 'Período inválido (YYYY-MM)' });
    const estado = await getCuotasEstadoMes(periodo);
    return reply.send({ ok: true, ...estado });
  });

  // POST /api/cuotas/generar/:periodo
  fastify.post('/generar/:periodo', { preHandler: requireAuth }, async (req, reply) => {
    const { periodo } = req.params as any;
    if (!/^\d{4}-\d{2}$/.test(periodo)) return reply.status(400).send({ error: 'Período inválido (YYYY-MM)' });
    const resultado = await generarCuotasMes(periodo);
    return reply.send({ ok: true, ...resultado });
  });

  // GET /api/cuotas/deudas
  fastify.get('/deudas', { preHandler: requireAuth }, async (req, reply) => {
    const deudas = await getFamiliaDeudas();
    return reply.send({ ok: true, deudas });
  });
}

