import { FastifyInstance } from 'fastify';
import { authRoutes } from './auth.routes.js';
import { categoriasRoutes } from './categorias.routes.js';
import { clubRoutes } from './club.routes.js';
import { cobrosRoutes } from './cobros.routes.js';
import { cuotasRoutes } from './cuotas.routes.js';
import { cuentasRoutes } from './cuentas.routes.js';
import { familiasRoutes } from './familias.routes.js';
import { healthRoutes } from './health.js';
import { inicioRoutes } from './inicio.routes.js';
import { reportesRoutes } from './reportes.routes.js';
import { rubrosRoutes } from './rubros.routes.js';
import { sociosRoutes } from './socios.routes.js';
import { tesoreriaRoutes } from './tesoreria.routes.js';
import { transparenciaRoutes, transparenciaPublicaRoutes } from './transparencia.routes.js';
import { usuariosRoutes } from './usuarios.routes.js';

export async function registerRoutes(fastify: FastifyInstance) {
  await fastify.register(healthRoutes, { prefix: '/api' });
  await fastify.register(authRoutes, { prefix: '/api/auth' });
  await fastify.register(clubRoutes, { prefix: '/api/club' });
  await fastify.register(categoriasRoutes, { prefix: '/api/categorias' });
  await fastify.register(cuentasRoutes, { prefix: '/api/cuentas' });
  await fastify.register(rubrosRoutes, { prefix: '/api/rubros' });
  await fastify.register(usuariosRoutes, { prefix: '/api/usuarios' });
  await fastify.register(sociosRoutes, { prefix: '/api/socios' });
  await fastify.register(familiasRoutes, { prefix: '/api/familias' });
  await fastify.register(cuotasRoutes, { prefix: '/api/cuotas' });
  await fastify.register(cobrosRoutes, { prefix: '/api/cobros' });
  await fastify.register(tesoreriaRoutes, { prefix: '/api/tesoreria' });
  await fastify.register(inicioRoutes, { prefix: '/api/inicio' });
  await fastify.register(reportesRoutes, { prefix: '/api/reportes' });
  await fastify.register(transparenciaRoutes, { prefix: '/api/transparencia' });
  await fastify.register(transparenciaPublicaRoutes, { prefix: '/api/publico' });
}
