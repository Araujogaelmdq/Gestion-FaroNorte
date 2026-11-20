import { FastifyInstance } from 'fastify';
import { requireAuth } from '../middlewares/auth.middleware.js';
import {
  exportarReportesExcel,
  getReporteCobranza,
  getReporteIngresosGastos,
  getReporteMorosos,
  getReporteSocios,
} from '../services/reportes.service.js';

export async function reportesRoutes(fastify: FastifyInstance) {
  fastify.get('/ingresos-gastos', { preHandler: requireAuth }, async (req, reply) => {
    const q = req.query as any;
    const data = await getReporteIngresosGastos(q.desde, q.hasta);
    return reply.send({ ok: true, ...data });
  });

  fastify.get('/cobranza', { preHandler: requireAuth }, async (req, reply) => {
    const q = req.query as any;
    const data = await getReporteCobranza(q.desde, q.hasta);
    return reply.send({ ok: true, ...data });
  });

  fastify.get('/morosos', { preHandler: requireAuth }, async (req, reply) => {
    const data = await getReporteMorosos();
    return reply.send({ ok: true, morosos: data });
  });

  fastify.get('/socios', { preHandler: requireAuth }, async (req, reply) => {
    const q = req.query as any;
    const data = await getReporteSocios(q.mes);
    return reply.send({ ok: true, ...data });
  });

  fastify.get('/exportar', { preHandler: requireAuth }, async (req, reply) => {
    const q = req.query as any;
    const workbook = await exportarReportesExcel(q.tipo || 'todos', q.desde, q.hasta);
    reply.header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    reply.header('Content-Disposition', 'attachment; filename="reportes.xlsx"');
    const buffer = await workbook.xlsx.writeBuffer();
    return reply.send(buffer);
  });
}

