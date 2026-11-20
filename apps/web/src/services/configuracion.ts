import {
  Categoria,
  CategoriaInput,
  Club,
  ClubInput,
  Cuenta,
  CuentaInput,
  Rubro,
  RubroInput,
  TipoRubro,
} from '@faronorte/shared';
import { apiFetch } from './api';

export async function getClub(): Promise<Club> {
  const res = await apiFetch<{ ok: boolean; club: Club }>('/api/club');
  return res.club;
}

export async function updateClub(data: ClubInput): Promise<Club> {
  const res = await apiFetch<{ ok: boolean; club: Club; mensaje: string }>('/api/club', {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  return res.club;
}

export async function getCategorias(soloActivas = false): Promise<Categoria[]> {
  const url = soloActivas ? '/api/categorias?soloActivas=true' : '/api/categorias';
  const res = await apiFetch<{ ok: boolean; categorias: Categoria[] }>(url);
  return res.categorias;
}

export async function createCategoria(data: CategoriaInput): Promise<Categoria> {
  const res = await apiFetch<{ ok: boolean; categoria: Categoria; mensaje: string }>(
    '/api/categorias',
    {
      method: 'POST',
      body: JSON.stringify(data),
    }
  );
  return res.categoria;
}

export async function updateCategoria(
  id: number,
  data: Partial<CategoriaInput>
): Promise<Categoria> {
  const res = await apiFetch<{ ok: boolean; categoria: Categoria; mensaje: string }>(
    `/api/categorias/${id}`,
    {
      method: 'PUT',
      body: JSON.stringify(data),
    }
  );
  return res.categoria;
}

export async function deleteCategoria(
  id: number
): Promise<{ mensaje: string; desactiva: boolean }> {
  return apiFetch<{ ok: boolean; mensaje: string; desactiva: boolean }>(`/api/categorias/${id}`, {
    method: 'DELETE',
  });
}

// Cuentas
export async function getCuentas(soloActivas = false): Promise<Cuenta[]> {
  const url = soloActivas ? '/api/cuentas?soloActivas=true' : '/api/cuentas';
  const res = await apiFetch<{ ok: boolean; cuentas: Cuenta[] }>(url);
  return res.cuentas;
}

export async function createCuenta(data: CuentaInput): Promise<Cuenta> {
  const res = await apiFetch<{ ok: boolean; cuenta: Cuenta; mensaje: string }>('/api/cuentas', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return res.cuenta;
}

export async function updateCuenta(
  id: number,
  data: Partial<CuentaInput>
): Promise<Cuenta> {
  const res = await apiFetch<{ ok: boolean; cuenta: Cuenta; mensaje: string }>(
    `/api/cuentas/${id}`,
    {
      method: 'PUT',
      body: JSON.stringify(data),
    }
  );
  return res.cuenta;
}

export async function deleteCuenta(
  id: number
): Promise<{ mensaje: string; desactiva: boolean }> {
  return apiFetch<{ ok: boolean; mensaje: string; desactiva: boolean }>(`/api/cuentas/${id}`, {
    method: 'DELETE',
  });
}

// Rubros
export async function getRubros(soloActivos = false, tipo?: TipoRubro): Promise<Rubro[]> {
  let url = '/api/rubros';
  const params: string[] = [];
  if (soloActivos) params.push('soloActivos=true');
  if (tipo) params.push(`tipo=${tipo}`);
  if (params.length > 0) url += `?${params.join('&')}`;

  const res = await apiFetch<{ ok: boolean; rubros: Rubro[] }>(url);
  return res.rubros;
}

export async function createRubro(data: RubroInput): Promise<Rubro> {
  const res = await apiFetch<{ ok: boolean; rubro: Rubro; mensaje: string }>('/api/rubros', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return res.rubro;
}

export async function updateRubro(
  id: number,
  data: Partial<RubroInput>
): Promise<Rubro> {
  const res = await apiFetch<{ ok: boolean; rubro: Rubro; mensaje: string }>(
    `/api/rubros/${id}`,
    {
      method: 'PUT',
      body: JSON.stringify(data),
    }
  );
  return res.rubro;
}

export async function deleteRubro(
  id: number
): Promise<{ mensaje: string; desactiva: boolean }> {
  return apiFetch<{ ok: boolean; mensaje: string; desactiva: boolean }>(`/api/rubros/${id}`, {
    method: 'DELETE',
  });
}

