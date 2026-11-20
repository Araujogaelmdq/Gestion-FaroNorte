import { FastifyInstance } from 'fastify';
import { requireAuth } from '../middlewares/auth.middleware.js';
import {
  anularMovimiento,
  crearMovimiento,
  exportarTesoreriaExcel,
  getMovimientos,
  getSaldosCuentas,
  getTotalesMes,
} from '../services/tesoreria.service.js';
import path from 'path';
import fs from 'fs';
import { pipeline } from 'stream/promises';

const UPLOAD_DIR = path.resolve('apps/api/uploads');

export async function tesoreriaRoutes(fastify: FastifyInstance) {
  // GET /api/tesoreria/saldos
  fastify.get('/saldos', { preHandler: requireAuth }, async (req, reply) => {
    const saldos = await getSaldosCuentas();
    return reply.send({ ok: true, saldos });
  });

  // GET /api/tesoreria/movimientos
  fastify.get('/movimientos', { preHandler: requireAuth }, async (req, reply) => {
    const q = req.query as any;
    const lista = await getMovimientos({
      mes: q.mes,
      tipo: q.tipo,
      cuenta_id: q.cuenta_id ? parseInt(q.cuenta_id) : undefined,
      rubro_id: q.rubro_id ? parseInt(q.rubro_id) : undefined,
      q: q.q,
    });
    return reply.send({ ok: true, movimientos: lista });
  });

  // GET /api/tesoreria/totales
  fastify.get('/totales', { preHandler: requireAuth }, async (req, reply) => {
    const mes = (req.query as any).mes || new Date().toISOString().slice(0, 7);
    const totales = await getTotalesMes(mes);
    return reply.send({ ok: true, ...totales });
  });

  // POST /api/tesoreria/movimientos
  fastify.post('/movimientos', { preHandler: requireAuth }, async (req, reply) => {
    const body = req.body as any;
    if (!body?.tipo || !body?.importe || !body?.fecha) {
      return reply.status(400).send({ error: 'Tipo, importe y fecha son obligatorios' });
    }
    if (!['gasto', 'ingreso', 'transferencia'].includes(body.tipo)) {
      return reply.status(400).send({ error: 'Tipo inválido' });
    }
    if (body.tipo === 'transferencia' && (!body.cuenta_origen_id || !body.cuenta_destino_id)) {
      return reply.status(400).send({ error: 'Transferencia requiere cuenta origen y destino' });
    }
    const mov = await crearMovimiento({ ...body, usuario_id: req.session.user!.id });
    return reply.status(201).send({ ok: true, movimiento: mov });
  });

  // POST /api/tesoreria/movimientos/:id/anular
  fastify.post('/movimientos/:id/anular', { preHandler: requireAuth }, async (req, reply) => {
    const id = parseInt((req.params as any).id);
    if (isNaN(id)) return reply.status(400).send({ error: 'ID inválido' });
    const body = req.body as any;
    if (!body?.motivo) return reply.status(400).send({ error: 'El motivo es obligatorio' });
    try {
      await anularMovimiento(id, body.motivo);
      return reply.send({ ok: true });
    } catch (err: any) {
      return reply.status(err.statusCode || 500).send({ error: err.message });
    }
  });

  // GET /api/tesoreria/exportar
  fastify.get('/exportar', { preHandler: requireAuth }, async (req, reply) => {
    const q = req.query as any;
    const workbook = await exportarTesoreriaExcel({
      desde: q.desde,
      hasta: q.hasta,
      tipo: q.tipo,
      cuenta_id: q.cuenta_id ? parseInt(q.cuenta_id) : undefined,
      rubro_id: q.rubro_id ? parseInt(q.rubro_id) : undefined,
    });
    reply.header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    reply.header('Content-Disposition', 'attachment; filename="tesoreria.xlsx"');
    const buffer = await workbook.xlsx.writeBuffer();
    return reply.send(buffer);
  });
}

