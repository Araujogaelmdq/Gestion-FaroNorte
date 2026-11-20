import { FastifyInstance } from 'fastify';
import { requireAuth } from '../middlewares/auth.middleware.js';
import {
  createSocioService,
  getSocioByIdService,
  listSociosService,
  updateSocioService,
} from '../services/socios.service.js';
import ExcelJS from 'exceljs';

export async function sociosRoutes(fastify: FastifyInstance) {
  // GET /api/socios
  fastify.get('/', { preHandler: requireAuth }, async (req, reply) => {
    const q = req.query as any;
    const lista = await listSociosService({
      q: q.q,
      categoria_id: q.categoria_id ? parseInt(q.categoria_id) : undefined,
      estado: q.estado,
      estado_apto: q.estado_apto,
    });
    return reply.send({ ok: true, socios: lista, total: lista.length });
  });

  // GET /api/socios/plantilla (Excel template)
  fastify.get('/plantilla', { preHandler: requireAuth }, async (req, reply) => {
    const workbook = new ExcelJS.Workbook();

    const instrSheet = workbook.addWorksheet('Instrucciones');
    instrSheet.addRow(['PLANILLA DE IMPORTACIÓN DE SOCIOS — FARO NORTE']);
    instrSheet.addRow(['']);
    instrSheet.addRow(['Columnas obligatorias: apellido, nombre, dni']);
    instrSheet.addRow(['Columnas opcionales: nacimiento (dd/mm/aaaa), categoria, familia, tutor, telefono, estado (activo/baja/vitalicio), vencimiento_apto (dd/mm/aaaa)']);
    instrSheet.addRow(['El DNI debe ser único. Si ya existe, se actualizará el socio.']);
    instrSheet.addRow(['Categoría: ingresá el nombre exacto (Mayor, Menor, Cadete, etc.)']);
    instrSheet.addRow(['Familia: ingresá el nombre de la familia. Si no existe, se creará.']);

    const dataSheet = workbook.addWorksheet('Socios');
    const headers = ['apellido', 'nombre', 'dni', 'nacimiento', 'categoria', 'familia', 'tutor', 'telefono', 'estado', 'vencimiento_apto'];
    dataSheet.addRow(headers);
    // Ejemplos
    dataSheet.addRow(['García', 'Juan', '12345678', '15/03/1985', 'Mayor', 'García-López', '', '2213456789', 'activo', '']);
    dataSheet.addRow(['López', 'María', '23456789', '20/07/1990', 'Mayor', 'García-López', '', '2219876543', 'activo', '30/06/2026']);
    dataSheet.addRow(['García', 'Tomás', '34567890', '05/09/2010', 'Menor', 'García-López', 'García Juan', '2213456789', 'activo', '']);

    const headerRow = dataSheet.getRow(1);
    headerRow.font = { bold: true };
    headers.forEach((_, i) => {
      dataSheet.getColumn(i + 1).width = 20;
    });

    reply.header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    reply.header('Content-Disposition', 'attachment; filename="plantilla-socios.xlsx"');
    const buffer = await workbook.xlsx.writeBuffer();
    return reply.send(buffer);
  });

  // GET /api/socios/exportar
  fastify.get('/exportar', { preHandler: requireAuth }, async (req, reply) => {
    const todos = await listSociosService();
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Padrón');
    const headers = ['numero', 'apellido', 'nombre', 'dni', 'nacimiento', 'edad', 'categoria', 'familia', 'tutor', 'telefono', 'estado', 'estado_apto', 'vencimiento_apto'];
    sheet.addRow(headers);
    for (const s of todos) {
      sheet.addRow([
        s.numero, s.apellido, s.nombre, s.dni, s.nacimiento || '',
        s.edad || '', s.categoria_nombre || '', s.familia_nombre || '',
        s.tutor || '', s.telefono || '', s.estado, s.estado_apto, s.vencimiento_apto || '',
      ]);
    }
    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true };
    headers.forEach((_, i) => { sheet.getColumn(i + 1).width = 18; });

    reply.header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    reply.header('Content-Disposition', 'attachment; filename="padron-socios.xlsx"');
    const buffer = await workbook.xlsx.writeBuffer();
    return reply.send(buffer);
  });

  // POST /api/socios/importar/preview
  fastify.post('/importar/preview', { preHandler: requireAuth }, async (req, reply) => {
    const body = req.body as any;
    if (!body?.rows || !Array.isArray(body.rows)) {
      return reply.status(400).send({ error: 'Se esperan filas de datos' });
    }

    const { socios: sociosActuales } = await import('../services/socios.service.js').then(m => m.listSociosService().then(s => ({ socios: s })));
    const dniExistentes = new Map(sociosActuales.map((s) => [s.dni, s]));

    const preview = body.rows.map((row: any, idx: number) => {
      const errors: string[] = [];
      if (!row.apellido) errors.push('Apellido obligatorio');
      if (!row.nombre) errors.push('Nombre obligatorio');
      if (!row.dni) errors.push('DNI obligatorio');

      let tipo: 'nueva' | 'actualiza' | 'error' = 'nueva';
      if (errors.length > 0) {
        tipo = 'error';
      } else if (dniExistentes.has(String(row.dni))) {
        tipo = 'actualiza';
      }

      return { fila: idx + 2, tipo, errores: errors, datos: row };
    });

    return reply.send({ ok: true, preview });
  });

  // POST /api/socios/importar/confirmar
  fastify.post('/importar/confirmar', { preHandler: requireAuth }, async (req, reply) => {
    const body = req.body as any;
    if (!body?.rows || !Array.isArray(body.rows)) {
      return reply.status(400).send({ error: 'Se esperan filas de datos' });
    }

    const { db: dbClient } = await import('../db/client.js');
    const { socios: sociosTable, categorias: categoriasTable, familias: familiasTable } = await import('../db/schema.js');
    const { eq } = await import('drizzle-orm');

    const cats = await dbClient.select().from(categoriasTable);
    const fams = await dbClient.select().from(familiasTable);
    const catMap = new Map(cats.map((c) => [c.nombre.toLowerCase(), c.id]));
    const famMap = new Map(fams.map((f) => [f.nombre.toLowerCase(), f.id]));

    let creados = 0, actualizados = 0, errores = 0;

    for (const row of body.rows) {
      if (!row.apellido || !row.nombre || !row.dni) { errores++; continue; }

      // Resolver categoría
      let categoria_id: number | null = null;
      if (row.categoria) {
        categoria_id = catMap.get(row.categoria.toLowerCase()) || null;
      }

      // Resolver/crear familia
      let familia_id: number | null = null;
      if (row.familia) {
        const famKey = row.familia.toLowerCase();
        if (famMap.has(famKey)) {
          familia_id = famMap.get(famKey)!;
        } else {
          const [newFam] = await dbClient.insert(familiasTable).values({ nombre: row.familia }).returning();
          familia_id = newFam.id;
          famMap.set(famKey, familia_id);
        }
      }

      try {
        const [existente] = await dbClient.select().from(sociosTable).where(eq(sociosTable.dni, String(row.dni))).limit(1);
        if (existente) {
          await updateSocioService(existente.id, { apellido: row.apellido, nombre: row.nombre, categoria_id, familia_id, tutor: row.tutor || null, telefono: row.telefono || null });
          actualizados++;
        } else {
          await createSocioService({ apellido: row.apellido, nombre: row.nombre, dni: String(row.dni), nacimiento: row.nacimiento || null, categoria_id, familia_id, tutor: row.tutor || null, telefono: row.telefono || null, estado: row.estado || 'activo' });
          creados++;
        }
      } catch {
        errores++;
      }
    }

    return reply.send({ ok: true, creados, actualizados, errores });
  });

  // GET /api/socios/:id
  fastify.get('/:id', { preHandler: requireAuth }, async (req, reply) => {
    const id = parseInt((req.params as any).id);
    if (isNaN(id)) return reply.status(400).send({ error: 'ID inválido' });
    try {
      const socio = await getSocioByIdService(id);
      return reply.send({ ok: true, socio });
    } catch (err: any) {
      return reply.status(err.statusCode || 500).send({ error: err.message });
    }
  });

  // POST /api/socios
  fastify.post('/', { preHandler: requireAuth }, async (req, reply) => {
    const body = req.body as any;
    if (!body?.apellido || !body?.nombre || !body?.dni) {
      return reply.status(400).send({ error: 'Apellido, nombre y DNI son obligatorios' });
    }
    try {
      const socio = await createSocioService(body);
      return reply.status(201).send({ ok: true, socio });
    } catch (err: any) {
      return reply.status(err.statusCode || 500).send({ error: err.message });
    }
  });

  // PUT /api/socios/:id
  fastify.put('/:id', { preHandler: requireAuth }, async (req, reply) => {
    const id = parseInt((req.params as any).id);
    if (isNaN(id)) return reply.status(400).send({ error: 'ID inválido' });
    try {
      const socio = await updateSocioService(id, req.body as any);
      return reply.send({ ok: true, socio });
    } catch (err: any) {
      return reply.status(err.statusCode || 500).send({ error: err.message });
    }
  });
}

