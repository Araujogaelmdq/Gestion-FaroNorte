import fastifyCookie from '@fastify/cookie';
import fastifyCors from '@fastify/cors';
import fastifySession from '@fastify/session';
import fastifyStatic from '@fastify/static';
import Fastify from 'fastify';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { env } from './config/env.js';
import { runSeed } from './db/seed.js';
import { registerRoutes } from './routes/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

declare module 'fastify' {
  interface FastifySessionObject {
    user?: {
      id: number;
      email: string;
      nombre: string;
      rol: string;
      debe_cambiar_clave: boolean;
    };
  }
}

async function buildServer() {
  const fastify = Fastify({
    logger: {
      transport: {
        target: 'pino-pretty',
        options: {
          translateTime: 'HH:MM:ss Z',
          ignore: 'pid,hostname',
        },
      },
    },
  });

  // CORS
  await fastify.register(fastifyCors, {
    origin: (origin, cb) => {
      // Permitir solicitudes del front en desarrollo y sin origen (e.g. apps móviles / curl)
      if (!origin || origin.includes('localhost') || origin.includes('127.0.0.1')) {
        cb(null, true);
        return;
      }
      if (origin === env.CORS_ORIGIN) {
        cb(null, true);
        return;
      }
      cb(new Error('No permitido por CORS'), false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  });

  // Cookies & Sessions
  await fastify.register(fastifyCookie);
  await fastify.register(fastifySession, {
    secret: env.SESSION_SECRET,
    cookieName: 'sessionId',
    cookie: {
      secure: env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 días
      sameSite: 'lax',
      path: '/',
    },
    saveUninitialized: false,
  });

  // Manejo de errores uniforme: { error: string, mensaje: string }
  fastify.setErrorHandler((error, request, reply) => {
    request.log.error(error);

    const statusCode =
      error.statusCode && error.statusCode >= 400 && error.statusCode < 600
        ? error.statusCode
        : 500;

    return reply.status(statusCode).send({
      error: error.name || 'Error del servidor',
      mensaje: error.message || 'Ocurrió un error inesperado',
    });
  });

  // Rutas API
  await registerRoutes(fastify);

  // Servir frontend compilado en producción si existe la carpeta dist
  const possibleDistPaths = [
    path.resolve(process.cwd(), 'apps/web/dist'),
    path.resolve(__dirname, '../../web/dist'),
    path.resolve(__dirname, '../../../apps/web/dist'),
  ];
  const webDistPath = possibleDistPaths.find((p) => fs.existsSync(p));

  if (webDistPath) {
    fastify.log.info(`📁 Servidor web estático montado desde: ${webDistPath}`);
    await fastify.register(fastifyStatic, {
      root: webDistPath,
      prefix: '/',
      wildcard: false,
    });

    // Fallback SPA: las rutas que no sean de /api devuelven index.html
    fastify.setNotFoundHandler((request, reply) => {
      if (request.raw.url?.startsWith('/api')) {
        return reply.status(404).send({
          error: 'Ruta no encontrada',
          mensaje: `La ruta ${request.method} ${request.url} no existe`,
        });
      }
      return reply.sendFile('index.html');
    });
  } else {
    // 404 Uniforme para desarrollo
    fastify.setNotFoundHandler((request, reply) => {
      reply.status(404).send({
        error: 'Ruta no encontrada',
        mensaje: `La ruta ${request.method} ${request.url} no existe`,
      });
    });
  }

  return fastify;
}

async function start() {
  try {
    // Asegurar esquema y seed inicial
    await runSeed();

    const app = await buildServer();
    await app.listen({ port: env.PORT, host: env.HOST });
    console.log(`🚀 API Faro Norte corriendo en http://${env.HOST}:${env.PORT}`);
  } catch (err) {
    console.error('❌ Error al iniciar servidor:', err);
    process.exit(1);
  }
}

// Iniciar servidor si es el script principal
start();
