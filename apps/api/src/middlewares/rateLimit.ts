import { FastifyReply, FastifyRequest } from 'fastify';

interface AttemptRecord {
  count: number;
  blockedUntil: number;
}

const attempts = new Map<string, AttemptRecord>();
const MAX_ATTEMPTS = 5;
const BLOCK_DURATION_MS = 15 * 60 * 1000; // 15 minutos

export function checkLoginRateLimit(req: FastifyRequest, reply: FastifyReply) {
  const ip = req.ip || 'unknown';
  const now = Date.now();
  const record = attempts.get(ip);

  if (record && record.count >= MAX_ATTEMPTS) {
    if (now < record.blockedUntil) {
      const remainingMinutes = Math.ceil((record.blockedUntil - now) / 60000);
      reply.status(429).send({
        error: 'Demasiados intentos',
        mensaje: `Superaste los 5 intentos permitidos. Por seguridad, volvé a intentar en ${remainingMinutes} minutos.`,
      });
      return false;
    } else {
      // Pasó el tiempo de bloqueo, reset
      attempts.delete(ip);
    }
  }

  return true;
}

export function recordFailedLogin(req: FastifyRequest) {
  const ip = req.ip || 'unknown';
  const now = Date.now();
  const record = attempts.get(ip) || { count: 0, blockedUntil: 0 };

  record.count += 1;
  if (record.count >= MAX_ATTEMPTS) {
    record.blockedUntil = now + BLOCK_DURATION_MS;
  }
  attempts.set(ip, record);
}

export function resetLoginAttempts(req: FastifyRequest) {
  const ip = req.ip || 'unknown';
  attempts.delete(ip);
}
