import { UsuarioSesion } from '@faronorte/shared';
import { apiFetch } from './api';

export interface LoginResponse {
  ok: boolean;
  usuario: UsuarioSesion;
}

export interface MeResponse {
  ok: boolean;
  usuario: UsuarioSesion;
}

export interface MessageResponse {
  ok: boolean;
  mensaje: string;
}

export async function loginApi(email: string, contrasena: string): Promise<LoginResponse> {
  return apiFetch<LoginResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, contrasena }),
  });
}

export async function logoutApi(): Promise<MessageResponse> {
  return apiFetch<MessageResponse>('/api/auth/logout', {
    method: 'POST',
  });
}

export async function getMeApi(): Promise<MeResponse> {
  return apiFetch<MeResponse>('/api/auth/me', {
    method: 'GET',
  });
}

export async function cambiarClaveApi(
  contrasenaActual: string | undefined,
  contrasenaNueva: string,
  confirmarContrasena: string,
): Promise<MessageResponse> {
  return apiFetch<MessageResponse>('/api/auth/cambiar-clave', {
    method: 'POST',
    body: JSON.stringify({
      contrasenaActual,
      contrasenaNueva,
      confirmarContrasena,
    }),
  });
}
