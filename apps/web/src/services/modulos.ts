import { apiFetch } from './api';

// ─── Socios ───────────────────────────────────────────────────────────────────
export interface SocioFilters {
  q?: string;
  categoria_id?: number;
  estado?: string;
  estado_apto?: string;
}

export const sociosService = {
  listar: (filters?: SocioFilters) => {
    const params = new URLSearchParams();
    if (filters?.q) params.set('q', filters.q);
    if (filters?.categoria_id) params.set('categoria_id', String(filters.categoria_id));
    if (filters?.estado) params.set('estado', filters.estado);
    if (filters?.estado_apto) params.set('estado_apto', filters.estado_apto);
    const qs = params.toString() ? `?${params}` : '';
    return apiFetch<{ ok: boolean; socios: any[]; total: number }>(`/api/socios${qs}`);
  },
  obtener: (id: number) => apiFetch<{ ok: boolean; socio: any }>(`/api/socios/${id}`),
  crear: (data: any) => apiFetch<{ ok: boolean; socio: any }>('/api/socios', { method: 'POST', body: JSON.stringify(data) }),
  actualizar: (id: number, data: any) => apiFetch<{ ok: boolean; socio: any }>(`/api/socios/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  exportar: () => `/api/socios/exportar`,
  plantilla: () => `/api/socios/plantilla`,
  importarPreview: (rows: any[]) => apiFetch<{ ok: boolean; preview: any[] }>('/api/socios/importar/preview', { method: 'POST', body: JSON.stringify({ rows }) }),
  importarConfirmar: (rows: any[]) => apiFetch<{ ok: boolean; creados: number; actualizados: number; errores: number }>('/api/socios/importar/confirmar', { method: 'POST', body: JSON.stringify({ rows }) }),
};

// ─── Familias ─────────────────────────────────────────────────────────────────
export const familiasService = {
  listar: (q?: string) => {
    const qs = q ? `?q=${encodeURIComponent(q)}` : '';
    return apiFetch<{ ok: boolean; familias: any[] }>(`/api/familias${qs}`);
  },
  obtener: (id: number) => apiFetch<{ ok: boolean; familia: any }>(`/api/familias/${id}`),
  crear: (data: any) => apiFetch<{ ok: boolean; familia: any }>('/api/familias', { method: 'POST', body: JSON.stringify(data) }),
  actualizar: (id: number, data: any) => apiFetch<{ ok: boolean; familia: any }>(`/api/familias/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
};

// ─── Usuarios ─────────────────────────────────────────────────────────────────
export const usuariosService = {
  listar: () => apiFetch<{ ok: boolean; usuarios: any[] }>('/api/usuarios'),
  crear: (data: any) => apiFetch<{ ok: boolean; usuario: any; contrasena_temporal: string }>('/api/usuarios', { method: 'POST', body: JSON.stringify(data) }),
  actualizar: (id: number, data: any) => apiFetch<{ ok: boolean; usuario: any }>(`/api/usuarios/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  generarClave: (id: number) => apiFetch<{ ok: boolean; contrasena_temporal: string }>(`/api/usuarios/${id}/generar-clave`, { method: 'POST' }),
};

// ─── Cuotas ───────────────────────────────────────────────────────────────────
export const cuotasService = {
  estado: (periodo: string) => apiFetch<any>(`/api/cuotas/estado/${periodo}`),
  generar: (periodo: string) => apiFetch<any>(`/api/cuotas/generar/${periodo}`, { method: 'POST' }),
  deudas: () => apiFetch<{ ok: boolean; deudas: any[] }>('/api/cuotas/deudas'),
};

// ─── Cobros ───────────────────────────────────────────────────────────────────
export const cobrosService = {
  buscar: (q: string) => apiFetch<{ ok: boolean; resultados: any[] }>(`/api/cobros/buscar?q=${encodeURIComponent(q)}`),
  cuotasPendientes: (familiaId: number) => apiFetch<{ ok: boolean; cuotas: any[] }>(`/api/cobros/familias/${familiaId}/cuotas-pendientes`),
  cobrar: (data: any) => apiFetch<{ ok: boolean; recibo: any }>('/api/cobros', { method: 'POST', body: JSON.stringify(data) }),
  recibos: (desde?: string, hasta?: string) => {
    const params = new URLSearchParams();
    if (desde) params.set('desde', desde);
    if (hasta) params.set('hasta', hasta);
    const qs = params.toString() ? `?${params}` : '';
    return apiFetch<{ ok: boolean; recibos: any[] }>(`/api/cobros/recibos${qs}`);
  },
  recibo: (id: number) => apiFetch<{ ok: boolean; recibo: any }>(`/api/cobros/recibos/${id}`),
  pdfUrl: (id: number) => `/api/cobros/recibos/${id}/pdf`,
  anular: (id: number, motivo: string) => apiFetch<{ ok: boolean }>(`/api/cobros/recibos/${id}/anular`, { method: 'POST', body: JSON.stringify({ motivo }) }),
};

// ─── Tesorería ────────────────────────────────────────────────────────────────
export const tesoreriaService = {
  saldos: () => apiFetch<{ ok: boolean; saldos: any[] }>('/api/tesoreria/saldos'),
  movimientos: (filters?: { mes?: string; tipo?: string; cuenta_id?: number; rubro_id?: number; q?: string }) => {
    const params = new URLSearchParams();
    if (filters?.mes) params.set('mes', filters.mes);
    if (filters?.tipo) params.set('tipo', filters.tipo);
    if (filters?.cuenta_id) params.set('cuenta_id', String(filters.cuenta_id));
    if (filters?.rubro_id) params.set('rubro_id', String(filters.rubro_id));
    if (filters?.q) params.set('q', filters.q);
    const qs = params.toString() ? `?${params}` : '';
    return apiFetch<{ ok: boolean; movimientos: any[] }>(`/api/tesoreria/movimientos${qs}`);
  },
  totales: (mes: string) => apiFetch<any>(`/api/tesoreria/totales?mes=${mes}`),
  crearMovimiento: (data: any) => apiFetch<{ ok: boolean; movimiento: any }>('/api/tesoreria/movimientos', { method: 'POST', body: JSON.stringify(data) }),
  anularMovimiento: (id: number, motivo: string) => apiFetch<{ ok: boolean }>(`/api/tesoreria/movimientos/${id}/anular`, { method: 'POST', body: JSON.stringify({ motivo }) }),
  exportarUrl: (filters?: any) => {
    const params = new URLSearchParams(filters || {});
    return `/api/tesoreria/exportar?${params}`;
  },
};

// ─── Inicio ───────────────────────────────────────────────────────────────────
export const inicioService = {
  dashboard: () => apiFetch<any>('/api/inicio'),
};

// ─── Reportes ─────────────────────────────────────────────────────────────────
export const reportesService = {
  ingresosGastos: (desde?: string, hasta?: string) => {
    const params = new URLSearchParams();
    if (desde) params.set('desde', desde);
    if (hasta) params.set('hasta', hasta);
    return apiFetch<any>(`/api/reportes/ingresos-gastos?${params}`);
  },
  cobranza: (desde?: string, hasta?: string) => {
    const params = new URLSearchParams();
    if (desde) params.set('desde', desde);
    if (hasta) params.set('hasta', hasta);
    return apiFetch<any>(`/api/reportes/cobranza?${params}`);
  },
  morosos: () => apiFetch<{ ok: boolean; morosos: any[] }>('/api/reportes/morosos'),
  socios: (mes?: string) => apiFetch<any>(`/api/reportes/socios${mes ? `?mes=${mes}` : ''}`),
  exportarUrl: (tipo = 'todos', desde?: string, hasta?: string) => {
    const params = new URLSearchParams({ tipo });
    if (desde) params.set('desde', desde);
    if (hasta) params.set('hasta', hasta);
    return `/api/reportes/exportar?${params}`;
  },
};

// ─── Transparencia ────────────────────────────────────────────────────────────
export const transparenciaService = {
  getConfig: () => apiFetch<{ ok: boolean; config: any }>('/api/transparencia/config'),
  saveConfig: (config: any) => apiFetch<{ ok: boolean; config: any }>('/api/transparencia/config', { method: 'PUT', body: JSON.stringify(config) }),
  publica: () => fetch('/api/publico/transparencia').then((r) => r.json()),
};

