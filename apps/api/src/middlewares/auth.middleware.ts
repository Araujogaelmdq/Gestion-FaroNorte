import { FastifyReply, FastifyRequest } from 'fastify';

export async function requireAuth(req: FastifyRequest, reply: FastifyReply) {
  if (!req.session || !req.session.user) {
    return reply.status(401).send({
      error: 'No autorizado',
      mensaje: 'Debés iniciar sesión para continuar.',
    });
  }
}

export function requireRole(...roles: string[]) {
  return async (req: FastifyRequest, reply: FastifyReply) => {
    if (!req.session || !req.session.user) {
      return reply.status(401).send({
        error: 'No autorizado',
        mensaje: 'Debés iniciar sesión para continuar.',
      });
    }

    const userRol = req.session.user.rol;
    // Permitir administrador o admin siempre que se requiera rol administrativo
    const matches =
      roles.includes(userRol) ||
      (roles.includes('administrador') && userRol === 'admin') ||
      (roles.includes('admin') && userRol === 'administrador');

    if (!matches) {
      return reply.status(403).send({
        error: 'Acceso denegado',
        mensaje: 'No tenés permisos para realizar esta acción.',
      });
    }
  };
}
