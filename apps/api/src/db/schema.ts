import { sql } from 'drizzle-orm';
import { integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

// 1. Usuarios
export const usuarios = sqliteTable('usuarios', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  email: text('email').notNull().unique(),
  nombre: text('nombre').notNull(),
  rol: text('rol').notNull().default('secretario'), // 'administrador' | 'tesorero' | 'secretario' | 'profe'
  contrasena_hash: text('contrasena_hash').notNull(),
  activo: integer('activo', { mode: 'boolean' }).notNull().default(true),
  debe_cambiar_clave: integer('debe_cambiar_clave', { mode: 'boolean' }).notNull().default(false),
  creado_en: text('creado_en').notNull().default(sql`CURRENT_TIMESTAMP`),
});

// 2. Club (id=1 fila única)
export const club = sqliteTable('club', {
  id: integer('id').primaryKey().default(1),
  nombre: text('nombre').notNull().default('Faro Norte'),
  contacto: text('contacto'),
  escudo_url: text('escudo_url'),
  dia_vencimiento: integer('dia_vencimiento').notNull().default(10),
  descuento_familiar_pct: integer('descuento_familiar_pct').default(0),
  actualizado_en: text('actualizado_en'),
});

// 3. Categorías de socios
export const categorias = sqliteTable('categorias', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  nombre: text('nombre').notNull(),
  valor_cuota_centavos: integer('valor_cuota_centavos').notNull(),
  activa: integer('activa', { mode: 'boolean' }).notNull().default(true),
});

// 4. Familias
export const familias = sqliteTable('familias', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  nombre: text('nombre').notNull(),
  responsable_nombre: text('responsable_nombre'),
  responsable_dni: text('responsable_dni'),
  responsable_telefono: text('responsable_telefono'),
  creado_en: text('creado_en').notNull().default(sql`CURRENT_TIMESTAMP`),
});

// 5. Socios
export const socios = sqliteTable('socios', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  numero: integer('numero').notNull().unique(),
  apellido: text('apellido').notNull(),
  nombre: text('nombre').notNull(),
  dni: text('dni').notNull().unique(),
  nacimiento: text('nacimiento'),
  categoria_id: integer('categoria_id').references(() => categorias.id),
  familia_id: integer('familia_id').references(() => familias.id),
  tutor: text('tutor'),
  telefono: text('telefono'),
  estado: text('estado').notNull().default('activo'), // 'activo' | 'baja' | 'vitalicio'
  vencimiento_apto: text('vencimiento_apto'),
  creado_en: text('creado_en').notNull().default(sql`CURRENT_TIMESTAMP`),
  actualizado_en: text('actualizado_en'),
});

// 6. Recibos (declarado antes de cuotas por la referencia opcional de cuotas.recibo_id)
export const recibos = sqliteTable('recibos', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  numero: integer('numero').notNull().unique(),
  familia_id: integer('familia_id').references(() => familias.id),
  usuario_id: integer('usuario_id').notNull().references(() => usuarios.id),
  fecha: text('fecha').notNull(),
  total: integer('total').notNull(),
  medio_pago: text('medio_pago').notNull(),
  cuenta_id: integer('cuenta_id').references(() => cuentas.id),
  anulado: integer('anulado', { mode: 'boolean' }).notNull().default(false),
  motivo_anulacion: text('motivo_anulacion'),
  creado_en: text('creado_en').notNull().default(sql`CURRENT_TIMESTAMP`),
});

// 7. Cuotas (único socio_id + periodo)
export const cuotas = sqliteTable('cuotas', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  socio_id: integer('socio_id').notNull().references(() => socios.id),
  periodo: text('periodo').notNull(), // 'YYYY-MM'
  importe: integer('importe').notNull(),
  vence_en: text('vence_en').notNull(),
  pagado: integer('pagado', { mode: 'boolean' }).notNull().default(false),
  pagado_en: text('pagado_en'),
  recibo_id: integer('recibo_id').references(() => recibos.id),
  anulado: integer('anulado', { mode: 'boolean' }).notNull().default(false),
}, (table) => ({
  socioPeriodoIdx: uniqueIndex('cuotas_socio_periodo_unique').on(table.socio_id, table.periodo),
}));

// 8. Items de recibo
export const recibo_items = sqliteTable('recibo_items', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  recibo_id: integer('recibo_id').notNull().references(() => recibos.id),
  cuota_id: integer('cuota_id').notNull().references(() => cuotas.id),
  importe: integer('importe').notNull(),
});

// 9. Cuentas
export const cuentas = sqliteTable('cuentas', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  nombre: text('nombre').notNull(),
  saldo_inicial: integer('saldo_inicial').notNull().default(0),
  activa: integer('activa', { mode: 'boolean' }).notNull().default(true),
});

// 10. Rubros
export const rubros = sqliteTable('rubros', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  nombre: text('nombre').notNull(),
  tipo: text('tipo').notNull(), // 'ingreso' | 'gasto'
  privado: integer('privado', { mode: 'boolean' }).notNull().default(false),
  activo: integer('activo', { mode: 'boolean' }).notNull().default(true),
});

// 11. Movimientos
export const movimientos = sqliteTable('movimientos', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  tipo: text('tipo').notNull(), // 'gasto' | 'ingreso' | 'transferencia'
  importe: integer('importe').notNull(),
  fecha: text('fecha').notNull(),
  rubro_id: integer('rubro_id').references(() => rubros.id),
  cuenta_origen_id: integer('cuenta_origen_id').references(() => cuentas.id),
  cuenta_destino_id: integer('cuenta_destino_id').references(() => cuentas.id),
  detalle: text('detalle'),
  comprobante_url: text('comprobante_url'),
  anulado: integer('anulado', { mode: 'boolean' }).notNull().default(false),
  motivo_anulacion: text('motivo_anulacion'),
  usuario_id: integer('usuario_id').notNull().references(() => usuarios.id),
  creado_en: text('creado_en').notNull().default(sql`CURRENT_TIMESTAMP`),
});

// 12. Avisos de pago
export const avisos_de_pago = sqliteTable('avisos_de_pago', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  familia_id: integer('familia_id').references(() => familias.id),
  socio_id: integer('socio_id').references(() => socios.id),
  monto: integer('monto').notNull(),
  fecha_aviso: text('fecha_aviso').notNull(),
  comprobante_url: text('comprobante_url'),
  estado: text('estado').notNull().default('pendiente'), // 'pendiente' | 'confirmado' | 'rechazado'
  creado_en: text('creado_en').notNull().default(sql`CURRENT_TIMESTAMP`),
});

// 13. Auditoría
export const auditoria = sqliteTable('auditoria', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  usuario_id: integer('usuario_id').references(() => usuarios.id),
  accion: text('accion').notNull(),
  entidad: text('entidad').notNull(),
  entidad_id: integer('entidad_id'),
  detalle: text('detalle'),
  creado_en: text('creado_en').notNull().default(sql`CURRENT_TIMESTAMP`),
});
