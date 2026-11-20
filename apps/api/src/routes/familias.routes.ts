import { FastifyInstance } from 'fastify';
import { requireAuth } from '../middlewares/auth.middleware.js';
import {
  createFamiliaService,
  getFamiliasService,
  getFamiliaByIdService,
  moverSocioFamiliaService,
  updateFamiliaService,
} from '../services/familias.service.js';

export async function familiasRoutes(fastify: FastifyInstance) {
  fastify.get('/', { preHandler: requireAuth }, async (req, reply) => {
    const q = (req.query as any).q;
    const lista = await getFamiliasService(q);
    return reply.send({ ok: true, familias: lista });
  });

  fastify.get('/:id', { preHandler: requireAuth }, async (req, reply) => {
    const id = parseInt((req.params as any).id);
    if (isNaN(id)) return reply.status(400).send({ error: 'ID inválido' });
    try {
      const familia = await getFamiliaByIdService(id);
      return reply.send({ ok: true, familia });
    } catch (err: any) {
      return reply.status(err.statusCode || 500).send({ error: err.message });
    }
  });

  fastify.post('/', { preHandler: requireAuth }, async (req, reply) => {
    const body = req.body as any;
    if (!body?.nombre) return reply.status(400).send({ error: 'El nombre es obligatorio' });
    try {
      const familia = await createFamiliaService(body);
      return reply.status(201).send({ ok: true, familia });
    } catch (err: any) {
      return reply.status(err.statusCode || 500).send({ error: err.message });
    }
  });

  fastify.put('/:id', { preHandler: requireAuth }, async (req, reply) => {
    const id = parseInt((req.params as any).id);
    if (isNaN(id)) return reply.status(400).send({ error: 'ID inválido' });
    try {
      const familia = await updateFamiliaService(id, req.body as any);
      return reply.send({ ok: true, familia });
    } catch (err: any) {
      return reply.status(err.statusCode || 500).send({ error: err.message });
    }
  });

  // POST /api/familias/:id/mover-socio
  fastify.post('/:id/mover-socio', { preHandler: requireAuth }, async (req, reply) => {
    const id = parseInt((req.params as any).id);
    const body = req.body as any;
    if (isNaN(id) || !body?.socioId) return reply.status(400).send({ error: 'Datos inválidos' });
    await moverSocioFamiliaService(body.socioId, id);
    return reply.send({ ok: true });
  });
}

