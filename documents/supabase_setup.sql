-- ==============================================================
-- CLUB SOCIAL Y DEPORTIVO FARO NORTE — SETUP SUPABASE POSTGRESQL
-- Pegá y ejecutá este script en el SQL Editor de tu proyecto en Supabase
-- ==============================================================

-- 1. Usuarios
CREATE TABLE IF NOT EXISTS usuarios (
  id SERIAL PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  nombre TEXT NOT NULL,
  rol TEXT NOT NULL DEFAULT 'secretario',
  contrasena_hash TEXT NOT NULL,
  activo BOOLEAN NOT NULL DEFAULT true,
  debe_cambiar_clave BOOLEAN NOT NULL DEFAULT false,
  creado_en TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 2. Club (Fila única)
CREATE TABLE IF NOT EXISTS club (
  id INTEGER PRIMARY KEY DEFAULT 1,
  nombre TEXT NOT NULL DEFAULT 'Club Social y Deportivo Faro Norte',
  contacto TEXT,
  escudo_url TEXT,
  dia_vencimiento INTEGER NOT NULL DEFAULT 10,
  descuento_familiar_pct INTEGER DEFAULT 15,
  actualizado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Categorías
CREATE TABLE IF NOT EXISTS categorias (
  id SERIAL PRIMARY KEY,
  nombre TEXT NOT NULL,
  valor_cuota_centavos INTEGER NOT NULL,
  activa BOOLEAN NOT NULL DEFAULT true
);

-- 4. Familias
CREATE TABLE IF NOT EXISTS familias (
  id SERIAL PRIMARY KEY,
  nombre TEXT NOT NULL,
  responsable_nombre TEXT,
  responsable_dni TEXT,
  responsable_telefono TEXT,
  creado_en TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 5. Socios
CREATE TABLE IF NOT EXISTS socios (
  id SERIAL PRIMARY KEY,
  numero INTEGER NOT NULL UNIQUE,
  apellido TEXT NOT NULL,
  nombre TEXT NOT NULL,
  dni TEXT NOT NULL UNIQUE,
  nacimiento TEXT,
  categoria_id INTEGER REFERENCES categorias(id) ON DELETE SET NULL,
  familia_id INTEGER REFERENCES familias(id) ON DELETE SET NULL,
  tutor TEXT,
  telefono TEXT,
  estado TEXT NOT NULL DEFAULT 'activo',
  vencimiento_apto TEXT,
  creado_en TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  actualizado_en TIMESTAMP WITH TIME ZONE
);

-- 6. Cuentas
CREATE TABLE IF NOT EXISTS cuentas (
  id SERIAL PRIMARY KEY,
  nombre TEXT NOT NULL,
  saldo_inicial INTEGER NOT NULL DEFAULT 0,
  activa BOOLEAN NOT NULL DEFAULT true
);

-- 7. Recibos
CREATE TABLE IF NOT EXISTS recibos (
  id SERIAL PRIMARY KEY,
  numero INTEGER NOT NULL UNIQUE,
  familia_id INTEGER REFERENCES familias(id) ON DELETE SET NULL,
  usuario_id INTEGER NOT NULL REFERENCES usuarios(id),
  fecha TEXT NOT NULL,
  total INTEGER NOT NULL,
  medio_pago TEXT NOT NULL,
  cuenta_id INTEGER REFERENCES cuentas(id) ON DELETE SET NULL,
  anulado BOOLEAN NOT NULL DEFAULT false,
  motivo_anulacion TEXT,
  creado_en TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 8. Cuotas
CREATE TABLE IF NOT EXISTS cuotas (
  id SERIAL PRIMARY KEY,
  socio_id INTEGER NOT NULL REFERENCES socios(id) ON DELETE CASCADE,
  periodo TEXT NOT NULL,
  importe INTEGER NOT NULL,
  vence_en TEXT NOT NULL,
  pagado BOOLEAN NOT NULL DEFAULT false,
  pagado_en TEXT,
  recibo_id INTEGER REFERENCES recibos(id) ON DELETE SET NULL,
  anulado BOOLEAN NOT NULL DEFAULT false,
  CONSTRAINT cuotas_socio_periodo_unique UNIQUE (socio_id, periodo)
);

-- 9. Recibo Items
CREATE TABLE IF NOT EXISTS recibo_items (
  id SERIAL PRIMARY KEY,
  recibo_id INTEGER NOT NULL REFERENCES recibos(id) ON DELETE CASCADE,
  cuota_id INTEGER NOT NULL REFERENCES cuotas(id) ON DELETE CASCADE,
  importe INTEGER NOT NULL
);

-- 10. Rubros
CREATE TABLE IF NOT EXISTS rubros (
  id SERIAL PRIMARY KEY,
  nombre TEXT NOT NULL,
  tipo TEXT NOT NULL,
  privado BOOLEAN NOT NULL DEFAULT false,
  activo BOOLEAN NOT NULL DEFAULT true
);

-- 11. Movimientos
CREATE TABLE IF NOT EXISTS movimientos (
  id SERIAL PRIMARY KEY,
  tipo TEXT NOT NULL,
  importe INTEGER NOT NULL,
  fecha TEXT NOT NULL,
  rubro_id INTEGER REFERENCES rubros(id) ON DELETE SET NULL,
  cuenta_origen_id INTEGER REFERENCES cuentas(id) ON DELETE SET NULL,
  cuenta_destino_id INTEGER REFERENCES cuentas(id) ON DELETE SET NULL,
  detalle TEXT,
  comprobante_url TEXT,
  anulado BOOLEAN NOT NULL DEFAULT false,
  motivo_anulacion TEXT,
  usuario_id INTEGER NOT NULL REFERENCES usuarios(id),
  creado_en TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 12. Avisos de pago
CREATE TABLE IF NOT EXISTS avisos_de_pago (
  id SERIAL PRIMARY KEY,
  familia_id INTEGER REFERENCES familias(id) ON DELETE CASCADE,
  socio_id INTEGER REFERENCES socios(id) ON DELETE CASCADE,
  monto INTEGER NOT NULL,
  fecha_aviso TEXT NOT NULL,
  comprobante_url TEXT,
  estado TEXT NOT NULL DEFAULT 'pendiente',
  creado_en TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 13. Auditoría
CREATE TABLE IF NOT EXISTS auditoria (
  id SERIAL PRIMARY KEY,
  usuario_id INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
  accion TEXT NOT NULL,
  entidad TEXT NOT NULL,
  entidad_id INTEGER,
  detalle TEXT,
  creado_en TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- ==============================================================
-- DATOS INICIALES (CLUB, USUARIO ADMIN, CATEGORÍAS, CUENTAS, RUBROS)
-- ==============================================================

-- 1. Club
INSERT INTO club (id, nombre, contacto, escudo_url, dia_vencimiento, descuento_familiar_pct)
VALUES (1, 'Club Social y Deportivo Faro Norte', 'Av. Costanera y Faro, Mar del Plata | Tel: (0223) 456-7890 | contacto@faronorte.club', '/LogoFN.jpg', 10, 15)
ON CONFLICT (id) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  contacto = EXCLUDED.contacto,
  dia_vencimiento = EXCLUDED.dia_vencimiento,
  descuento_familiar_pct = EXCLUDED.descuento_familiar_pct;

-- 2. Categorías oficiales
INSERT INTO categorias (id, nombre, valor_cuota_centavos, activa) VALUES
  (1, 'Mayor', 18000, true),
  (2, 'Menor', 12000, true),
  (3, 'Cadete', 15000, true),
  (4, 'Vitalicio', 0, true)
ON CONFLICT (id) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  valor_cuota_centavos = EXCLUDED.valor_cuota_centavos,
  activa = EXCLUDED.activa;

-- 3. Cuentas oficiales
INSERT INTO cuentas (id, nombre, saldo_inicial, activa) VALUES
  (1, 'Caja efectivo', 15000, true),
  (2, 'Banco Provincia', 85000, true),
  (3, 'Mercado Pago', 45000, true),
  (4, 'Cantina / Buffet', 20000, true)
ON CONFLICT (id) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  saldo_inicial = EXCLUDED.saldo_inicial,
  activa = EXCLUDED.activa;

-- 4. Rubros iniciales
INSERT INTO rubros (id, nombre, tipo, privado, activo) VALUES
  (1, 'Cuotas sociales', 'ingreso', false, true),
  (2, 'Cantina', 'ingreso', false, true),
  (3, 'Servicios (Luz/Gas/Agua)', 'gasto', false, true),
  (4, 'Mantenimiento e infraestructura', 'gasto', false, true),
  (5, 'Materiales deportivos', 'gasto', false, true)
ON CONFLICT (id) DO NOTHING;

-- 5. Familias iniciales
INSERT INTO familias (id, nombre, responsable_nombre, responsable_dni, responsable_telefono) VALUES
  (1, 'Familia García', 'Juan García', '28456123', '2234567890'),
  (2, 'Familia Martínez', 'Carlos Martínez', '30112233', '2235678901'),
  (3, 'Familia Pérez', 'Romina Pérez', '32445566', '2236789012'),
  (4, 'Familia González', 'Fernando González', '26778899', '2237890123'),
  (5, 'Familia Rossi', 'Alberto Rossi', '14223344', '2238901234'),
  (6, 'Familia Fernández', 'Mateo Fernández', '44556677', '2239012345')
ON CONFLICT (id) DO NOTHING;

-- Reiniciar secuencias si se insertaron ids manuales
SELECT setval('categorias_id_seq', (SELECT MAX(id) FROM categorias));
SELECT setval('cuentas_id_seq', (SELECT MAX(id) FROM cuentas));
SELECT setval('rubros_id_seq', (SELECT MAX(id) FROM rubros));
SELECT setval('familias_id_seq', (SELECT MAX(id) FROM familias));

