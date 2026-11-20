import { FastifyInstance } from 'fastify';
import { categoriaSchema } from '@faronorte/shared';
import { requireAuth, requireRole } from '../middlewares/auth.middleware.js';
import {
  createCategoriaService,
  deleteCategoriaService,
  getCategoriasService,
  updateCategoriaService,
} from '../services/categorias.service.js';

export async function categoriasRoutes(fastify: FastifyInstance) {
  // GET /api/categorias
  fastify.get('/', { preHandler: [requireAuth] }, async (req, reply) => {
    try {
      const query = req.query as { soloActivas?: string };
      const soloActivas = query.soloActivas === 'true';
      const lista = await getCategoriasService(soloActivas);
      return reply.send({ ok: true, categorias: lista });
    } catch (err: any) {
      return reply.status(500).send({
        error: 'Error del servidor',
        mensaje: err.message || 'No se pudieron listar las categorías',
      });
    }
  });

  // POST /api/categorias (solo rol administrador)
  fastify.post(
    '/',
    { preHandler: [requireAuth, requireRole('administrador')] },
    async (req, reply) => {
      const parseResult = categoriaSchema.safeParse(req.body);
      if (!parseResult.success) {
        return reply.status(400).send({
          error: 'Datos inválidos',
          mensaje: parseResult.error.errors[0]?.message || 'Verificá los datos ingresados',
        });
      }

      try {
        const creada = await createCategoriaService(parseResult.data);
        return reply.status(201).send({
          ok: true,
          mensaje: 'Categoría creada con éxito',
          categoria: creada,
        });
      } catch (err: any) {
        return reply.status(500).send({
          error: 'Error del servidor',
          mensaje: err.message || 'No se pudo crear la categoría',
        });
      }
    }
  );

  // PUT /api/categorias/:id (solo rol administrador)
  fastify.put(
    '/:id',
    { preHandler: [requireAuth, requireRole('administrador')] },
    async (req, reply) => {
      const { id } = req.params as { id: string };
      const categoriaId = parseInt(id, 10);
      if (isNaN(categoriaId)) {
        return reply.status(400).send({ error: 'ID inválido', mensaje: 'El ID debe ser numérico' });
      }

      const parseResult = categoriaSchema.partial().safeParse(req.body);
      if (!parseResult.success) {
        return reply.status(400).send({
          error: 'Datos inválidos',
          mensaje: parseResult.error.errors[0]?.message || 'Verificá los datos ingresados',
        });
      }

      try {
        const actualizada = await updateCategoriaService(categoriaId, parseResult.data);
        return reply.send({
          ok: true,
          mensaje: 'Categoría actualizada correctamente',
          categoria: actualizada,
        });
      } catch (err: any) {
        return reply.status(400).send({
          error: 'Error en la actualización',
          mensaje: err.message || 'No se pudo actualizar la categoría',
        });
      }
    }
  );

  // DELETE /api/categorias/:id (solo rol administrador)
  fastify.delete(
    '/:id',
    { preHandler: [requireAuth, requireRole('administrador')] },
    async (req, reply) => {
      const { id } = req.params as { id: string };
      const categoriaId = parseInt(id, 10);
      if (isNaN(categoriaId)) {
        return reply.status(400).send({ error: 'ID inválido', mensaje: 'El ID debe ser numérico' });
      }

      try {
        const resultado = await deleteCategoriaService(categoriaId);
        return reply.send({ ok: true, ...resultado });
      } catch (err: any) {
        return reply.status(400).send({
          error: 'Error al eliminar',
          mensaje: err.message || 'No se pudo eliminar la categoría',
        });
      }
    }
  );
}

