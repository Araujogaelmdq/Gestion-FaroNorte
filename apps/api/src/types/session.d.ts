import '@fastify/session';

declare module 'fastify' {
  interface Session {
    user?: {
      id: number;
      email: string;
      nombre: string;
      rol: string;
      debe_cambiar_clave: boolean;
    };
  }

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
