export interface ApiErrorResponse {
  error: string;
  mensaje: string;
}

export class ApiError extends Error {
  error: string;
  statusCode: number;

  constructor(error: string, mensaje: string, statusCode: number) {
    super(mensaje);
    this.name = 'ApiError';
    this.error = error;
    this.statusCode = statusCode;
  }
}

export async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = endpoint.startsWith('http') ? endpoint : endpoint;

  const defaultHeaders: HeadersInit = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };

  const response = await fetch(url, {
    ...options,
    credentials: 'include', // Para enviar cookies de sesión
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  });

  let data: any;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    const errorMsg = data?.mensaje || data?.error || 'Ocurrió un error en la solicitud';
    const errorType = data?.error || 'Error';
    throw new ApiError(errorType, errorMsg, response.status);
  }

  return data as T;
}
