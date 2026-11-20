import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { sqlite } from './client.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const migrationsFolder = path.resolve(__dirname, '../../drizzle');

export async function runMigrations() {
  console.log('🔄 Ejecutando migraciones de base de datos SQLite...');

  // Si existe carpeta drizzle con migraciones SQL, aplicarlas en orden
  if (fs.existsSync(migrationsFolder)) {
    const files = fs.readdirSync(migrationsFolder).filter(f => f.endsWith('.sql')).sort();
    for (const file of files) {
      console.log(`  Aplicando ${file}...`);
      const sqlContent = fs.readFileSync(path.join(migrationsFolder, file), 'utf-8');
      sqlite.exec(sqlContent);
    }
  }

  // Asegurar la creación de todas las tablas con DDL
  const ddl = `
    CREATE TABLE IF NOT EXISTS usuarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      nombre TEXT NOT NULL,
      rol TEXT NOT NULL DEFAULT 'secretario',
      contrasena_hash TEXT NOT NULL,
      activo INTEGER NOT NULL DEFAULT 1,
      debe_cambiar_clave INTEGER NOT NULL DEFAULT 0,
      creado_en TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS club (
      id INTEGER PRIMARY KEY DEFAULT 1,
      nombre TEXT NOT NULL DEFAULT 'Faro Norte',
      contacto TEXT,
      escudo_url TEXT,
      dia_vencimiento INTEGER NOT NULL DEFAULT 10,
      descuento_familiar_pct INTEGER DEFAULT 0,
      actualizado_en TEXT
    );

    CREATE TABLE IF NOT EXISTS categorias (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      valor_cuota_centavos INTEGER NOT NULL,
      activa INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS familias (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      responsable_nombre TEXT,
      responsable_dni TEXT,
      responsable_telefono TEXT,
      creado_en TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS socios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      numero INTEGER NOT NULL UNIQUE,
      apellido TEXT NOT NULL,
      nombre TEXT NOT NULL,
      dni TEXT NOT NULL UNIQUE,
      nacimiento TEXT,
      categoria_id INTEGER REFERENCES categorias(id),
      familia_id INTEGER REFERENCES familias(id),
      tutor TEXT,
      telefono TEXT,
      estado TEXT NOT NULL DEFAULT 'activo',
      vencimiento_apto TEXT,
      creado_en TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      actualizado_en TEXT
    );

    CREATE TABLE IF NOT EXISTS recibos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      numero INTEGER NOT NULL UNIQUE,
      familia_id INTEGER REFERENCES familias(id),
      usuario_id INTEGER NOT NULL REFERENCES usuarios(id),
      fecha TEXT NOT NULL,
      total INTEGER NOT NULL,
      medio_pago TEXT NOT NULL,
      cuenta_id INTEGER REFERENCES cuentas(id),
      anulado INTEGER NOT NULL DEFAULT 0,
      motivo_anulacion TEXT,
      creado_en TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS cuotas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      socio_id INTEGER NOT NULL REFERENCES socios(id),
      periodo TEXT NOT NULL,
      importe INTEGER NOT NULL,
      vence_en TEXT NOT NULL,
      pagado INTEGER NOT NULL DEFAULT 0,
      pagado_en TEXT,
      recibo_id INTEGER REFERENCES recibos(id),
      anulado INTEGER NOT NULL DEFAULT 0
    );
    CREATE UNIQUE INDEX IF NOT EXISTS cuotas_socio_periodo_unique ON cuotas(socio_id, periodo);

    CREATE TABLE IF NOT EXISTS recibo_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      recibo_id INTEGER NOT NULL REFERENCES recibos(id),
      cuota_id INTEGER NOT NULL REFERENCES cuotas(id),
      importe INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS cuentas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      saldo_inicial INTEGER NOT NULL DEFAULT 0,
      activa INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS rubros (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      tipo TEXT NOT NULL,
      privado INTEGER NOT NULL DEFAULT 0,
      activo INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS movimientos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tipo TEXT NOT NULL,
      importe INTEGER NOT NULL,
      fecha TEXT NOT NULL,
      rubro_id INTEGER REFERENCES rubros(id),
      cuenta_origen_id INTEGER REFERENCES cuentas(id),
      cuenta_destino_id INTEGER REFERENCES cuentas(id),
      detalle TEXT,
      comprobante_url TEXT,
      anulado INTEGER NOT NULL DEFAULT 0,
      motivo_anulacion TEXT,
      usuario_id INTEGER NOT NULL REFERENCES usuarios(id),
      creado_en TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS avisos_de_pago (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      familia_id INTEGER REFERENCES familias(id),
      socio_id INTEGER REFERENCES socios(id),
      monto INTEGER NOT NULL,
      fecha_aviso TEXT NOT NULL,
      comprobante_url TEXT,
      estado TEXT NOT NULL DEFAULT 'pendiente',
      creado_en TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS auditoria (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      usuario_id INTEGER REFERENCES usuarios(id),
      accion TEXT NOT NULL,
      entidad TEXT NOT NULL,
      entidad_id INTEGER,
      detalle TEXT,
      creado_en TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `;

  sqlite.exec(ddl);
  console.log('✅ Esquema y tablas verificadas correctamente.');
}

// Ejecutar si es llamado directamente
if (process.argv[1] && process.argv[1].includes('migrate')) {
  runMigrations()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('❌ Error en migraciones:', err);
      process.exit(1);
    });
}
