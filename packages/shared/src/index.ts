import { z } from 'zod';

// Roles
export const ROLES = ['administrador', 'tesorero', 'secretario', 'profe'] as const;
export type Rol = typeof ROLES[number];

export const ESTADOS_SOCIO = ['activo', 'baja', 'vitalicio'] as const;
export type EstadoSocio = typeof ESTADOS_SOCIO[number];

export const TIPOS_RUBRO = ['ingreso', 'gasto'] as const;
export type TipoRubro = typeof TIPOS_RUBRO[number];

export const TIPOS_MOVIMIENTO = ['gasto', 'ingreso', 'transferencia'] as const;
export type TipoMovimiento = typeof TIPOS_MOVIMIENTO[number];

export const MEDIOS_PAGO = ['efectivo', 'transferencia', 'debito', 'tarjeta', 'otro'] as const;
export type MedioPago = typeof MEDIOS_PAGO[number];

// Auth Schemas
export const loginSchema = z.object({
  email: z.string().email('Ingresá un correo electrónico válido'),
  contrasena: z.string().min(1, 'Ingresá tu contraseña'),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const cambiarClaveSchema = z
  .object({
    contrasenaActual: z.string().optional(),
    contrasenaNueva: z.string().min(8, 'La nueva contraseña debe tener al menos 8 caracteres'),
    confirmarContrasena: z.string().min(1, 'Confirmá la nueva contraseña'),
  })
  .refine((data) => data.contrasenaNueva === data.confirmarContrasena, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmarContrasena'],
  });
export type CambiarClaveInput = z.infer<typeof cambiarClaveSchema>;

// User Profile DTO
export interface UsuarioSesion {
  id: number;
  email: string;
  nombre: string;
  rol: Rol;
  activo: boolean;
  debe_cambiar_clave: boolean;
}

// Formatters
export function formatearMoneda(importe: number): string {
  const formateado = new Intl.NumberFormat('es-AR', {
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(Math.round(importe));
  return `$ ${formateado}`;
}

export function formatearFecha(fechaStrOrDate?: string | Date | null): string {
  if (!fechaStrOrDate) return '-';
  const d = typeof fechaStrOrDate === 'string' ? new Date(fechaStrOrDate) : fechaStrOrDate;
  if (isNaN(d.getTime())) return String(fechaStrOrDate);
  const dia = String(d.getDate()).padStart(2, '0');
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const anio = d.getFullYear();
  return `${dia}/${mes}/${anio}`;
}

// Club Schemas & Types
export const clubSchema = z.object({
  nombre: z.string().min(1, 'El nombre del club es obligatorio'),
  contacto: z.string().optional().nullable(),
  escudo_url: z.string().optional().nullable(),
  dia_vencimiento: z.coerce
    .number()
    .int()
    .min(1, 'El día de vencimiento debe ser entre 1 y 28')
    .max(28, 'El día de vencimiento debe ser entre 1 y 28')
    .default(10),
  descuento_familiar_pct: z.coerce
    .number()
    .int()
    .min(0, 'El porcentaje debe ser entre 0 y 100')
    .max(100, 'El porcentaje debe ser entre 0 y 100')
    .default(0),
});
export type ClubInput = z.infer<typeof clubSchema>;

export interface Club {
  id: number;
  nombre: string;
  contacto: string | null;
  escudo_url: string | null;
  dia_vencimiento: number;
  descuento_familiar_pct: number;
  actualizado_en: string | null;
}

// Categorías Schemas & Types
export const categoriaSchema = z.object({
  nombre: z.string().min(1, 'El nombre de la categoría es obligatorio'),
  valor_cuota_centavos: z.coerce.number().int().min(0, 'El importe debe ser mayor o igual a 0'),
  activa: z.boolean().default(true),
});
export type CategoriaInput = z.infer<typeof categoriaSchema>;

export interface Categoria {
  id: number;
  nombre: string;
  valor_cuota_centavos: number;
  activa: boolean;
}

// Cuentas Schemas & Types
export const cuentaSchema = z.object({
  nombre: z.string().min(1, 'El nombre de la cuenta es obligatorio'),
  saldo_inicial: z.coerce.number().int().default(0),
  activa: z.boolean().default(true),
});
export type CuentaInput = z.infer<typeof cuentaSchema>;

export interface Cuenta {
  id: number;
  nombre: string;
  saldo_inicial: number;
  activa: boolean;
  creado_en?: string;
}

// Usuarios
export const usuarioSchema = z.object({
  email: z.string().email('Correo inválido'),
  nombre: z.string().min(1, 'El nombre es obligatorio'),
  rol: z.enum(ROLES, { errorMap: () => ({ message: 'Rol inválido' }) }),
});
export type UsuarioInput = z.infer<typeof usuarioSchema>;

export interface Usuario {
  id: number;
  email: string;
  nombre: string;
  rol: Rol;
  activo: boolean;
  debe_cambiar_clave: boolean;
  creado_en: string;
}

// Familias
export const familiaSchema = z.object({
  nombre: z.string().min(1, 'El nombre de la familia es obligatorio'),
  responsable_nombre: z.string().optional().nullable(),
  responsable_dni: z.string().optional().nullable(),
  responsable_telefono: z.string().optional().nullable(),
});
export type FamiliaInput = z.infer<typeof familiaSchema>;

export interface Familia {
  id: number;
  nombre: string;
  responsable_nombre: string | null;
  responsable_dni: string | null;
  responsable_telefono: string | null;
  creado_en: string;
  cantidad_socios?: number;
}

// Socios
export const socioSchema = z.object({
  apellido: z.string().min(1, 'El apellido es obligatorio'),
  nombre: z.string().min(1, 'El nombre es obligatorio'),
  dni: z.string().min(1, 'El DNI es obligatorio'),
  nacimiento: z.string().optional().nullable(),
  categoria_id: z.coerce.number().int().optional().nullable(),
  familia_id: z.coerce.number().int().optional().nullable(),
  tutor: z.string().optional().nullable(),
  telefono: z.string().optional().nullable(),
  estado: z.enum(ESTADOS_SOCIO).default('activo'),
  vencimiento_apto: z.string().optional().nullable(),
});
export type SocioInput = z.infer<typeof socioSchema>;

export interface Socio {
  id: number;
  numero: number;
  apellido: string;
  nombre: string;
  nombre_completo: string;
  dni: string;
  nacimiento: string | null;
  edad: number | null;
  categoria_id: number | null;
  categoria_nombre: string | null;
  familia_id: number | null;
  familia_nombre: string | null;
  tutor: string | null;
  telefono: string | null;
  estado: string;
  vencimiento_apto: string | null;
  estado_apto: 'vigente' | 'vencido' | 'sin_apto';
  creado_en: string;
  actualizado_en: string | null;
}

// Rubros Schemas & Types
export const rubroSchema = z.object({
  nombre: z.string().min(1, 'El nombre del rubro es obligatorio'),
  tipo: z.enum(TIPOS_RUBRO, { errorMap: () => ({ message: 'El tipo debe ser ingreso o gasto' }) }),
  privado: z.boolean().default(false),
  activo: z.boolean().default(true),
});
export type RubroInput = z.infer<typeof rubroSchema>;

export interface Rubro {
  id: number;
  nombre: string;
  tipo: TipoRubro;
  privado: boolean;
  activo: boolean;
  creado_en?: string;
}
