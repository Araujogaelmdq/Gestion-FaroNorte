import { FastifyInstance } from 'fastify';
import { requireAuth } from '../middlewares/auth.middleware.js';
import {
  anularRecibo,
  buscarFamiliaParaCobro,
  cobrarFamilia,
  getCuotasPendientesFamilia,
  getReciboById,
  getRecibos,
} from '../services/cobros.service.js';
import PDFDocument from 'pdfkit';

export async function cobrosRoutes(fastify: FastifyInstance) {
  // GET /api/cobros/buscar?q=
  fastify.get('/buscar', { preHandler: requireAuth }, async (req, reply) => {
    const q = (req.query as any).q || '';
    if (q.length < 2) return reply.send({ ok: true, resultados: [] });
    const resultados = await buscarFamiliaParaCobro(q);
    return reply.send({ ok: true, resultados });
  });

  // GET /api/cobros/familias/:id/cuotas-pendientes
  fastify.get('/familias/:id/cuotas-pendientes', { preHandler: requireAuth }, async (req, reply) => {
    const id = parseInt((req.params as any).id);
    if (isNaN(id)) return reply.status(400).send({ error: 'ID inválido' });
    const pendientes = await getCuotasPendientesFamilia(id);
    return reply.send({ ok: true, cuotas: pendientes });
  });

  // POST /api/cobros
  fastify.post('/', { preHandler: requireAuth }, async (req, reply) => {
    const body = req.body as any;
    if (!body?.cuota_ids?.length || !body?.importe || !body?.medio_pago || !body?.cuenta_id) {
      return reply.status(400).send({ error: 'Datos incompletos para el cobro' });
    }
    try {
      const recibo = await cobrarFamilia({
        familia_id: body.familia_id || null,
        cuota_ids: body.cuota_ids,
        importe: body.importe,
        medio_pago: body.medio_pago,
        cuenta_id: body.cuenta_id,
        usuario_id: req.session.user!.id,
      });
      return reply.status(201).send({ ok: true, recibo });
    } catch (err: any) {
      return reply.status(err.statusCode || 500).send({ error: err.message });
    }
  });

  // GET /api/cobros/recibos
  fastify.get('/recibos', { preHandler: requireAuth }, async (req, reply) => {
    const q = req.query as any;
    const lista = await getRecibos({ desde: q.desde, hasta: q.hasta });
    return reply.send({ ok: true, recibos: lista });
  });

  // GET /api/cobros/recibos/:id
  fastify.get('/recibos/:id', { preHandler: requireAuth }, async (req, reply) => {
    const id = parseInt((req.params as any).id);
    if (isNaN(id)) return reply.status(400).send({ error: 'ID inválido' });
    try {
      const recibo = await getReciboById(id);
      return reply.send({ ok: true, recibo });
    } catch (err: any) {
      return reply.status(err.statusCode || 500).send({ error: err.message });
    }
  });

  // GET /api/cobros/recibos/:id/pdf
  fastify.get('/recibos/:id/pdf', { preHandler: requireAuth }, async (req, reply) => {
    const id = parseInt((req.params as any).id);
    if (isNaN(id)) return reply.status(400).send({ error: 'ID inválido' });
    try {
      const recibo = await getReciboById(id);
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      reply.header('Content-Type', 'application/pdf');
      reply.header('Content-Disposition', `attachment; filename="recibo-${recibo.numero}.pdf"`);

      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => reply.send(Buffer.concat(chunks)));

      doc.fontSize(18).text('FARO NORTE', { align: 'center' });
      doc.fontSize(12).text('Club Social y Deportivo', { align: 'center' });
      doc.moveDown();
      doc.fontSize(16).text(`RECIBO N° ${String(recibo.numero).padStart(6, '0')}`, { align: 'center' });
      if (recibo.anulado) doc.fontSize(14).fillColor('red').text('*** ANULADO ***', { align: 'center' }).fillColor('black');
      doc.moveDown();
      doc.fontSize(11);
      doc.text(`Fecha: ${recibo.fecha}`);
      doc.text(`Familia: ${recibo.familia_nombre || '-'}`);
      doc.text(`Cobrado por: ${recibo.usuario_nombre}`);
      doc.text(`Medio de pago: ${recibo.medio_pago}`);
      doc.text(`Cuenta: ${recibo.cuenta_nombre || '-'}`);
      doc.moveDown();
      doc.text('Detalle:', { underline: true });
      for (const item of recibo.items) {
        const [a, m] = item.periodo.split('-');
        const meses = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
        const mesNombre = meses[parseInt(m) - 1] || m;
        doc.text(`  Cuota ${mesNombre} ${a}: $ ${item.importe.toLocaleString('es-AR')}`);
      }
      doc.moveDown();
      doc.fontSize(13).text(`TOTAL: $ ${recibo.total.toLocaleString('es-AR')}`, { align: 'right' });
      doc.end();
    } catch (err: any) {
      return reply.status(err.statusCode || 500).send({ error: err.message });
    }
  });

  // POST /api/cobros/recibos/:id/anular
  fastify.post('/recibos/:id/anular', { preHandler: requireAuth }, async (req, reply) => {
    const id = parseInt((req.params as any).id);
    if (isNaN(id)) return reply.status(400).send({ error: 'ID inválido' });
    const body = req.body as any;
    if (!body?.motivo) return reply.status(400).send({ error: 'El motivo de anulación es obligatorio' });
    try {
      await anularRecibo(id, body.motivo);
      return reply.send({ ok: true, mensaje: 'Recibo anulado' });
    } catch (err: any) {
      return reply.status(err.statusCode || 500).send({ error: err.message });
    }
  });
}
