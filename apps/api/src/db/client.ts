import Database from 'better-sqlite3';
import { drizzle as drizzleSqlite } from 'drizzle-orm/better-sqlite3';
import { drizzle as drizzlePg } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import path from 'path';
import { fileURLToPath } from 'url';
import { env } from '../config/env.js';
import * as schema from './schema.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const isPostgres =
  env.DATABASE_URL.startsWith('postgres://') || env.DATABASE_URL.startsWith('postgresql://');

let sqliteClient: any = null;
let pgClient: any = null;
let dbInstance: any = null;

if (isPostgres) {
  // Conexión a PostgreSQL (Supabase / Render)
  pgClient = postgres(env.DATABASE_URL, {
    prepare: false, // Requerido por Supabase Transaction Pooler (puerto 6543)
    ssl: 'require',
  });
  dbInstance = drizzlePg(pgClient, { schema: schema as any });
} else {
  // Conexión local a SQLite
  const dbPath = path.isAbsolute(env.DATABASE_URL)
    ? env.DATABASE_URL
    : path.resolve(__dirname, '../../', env.DATABASE_URL);

  sqliteClient = new Database(dbPath);
  sqliteClient.pragma('journal_mode = WAL');
  sqliteClient.pragma('foreign_keys = ON');
  dbInstance = drizzleSqlite(sqliteClient, { schema: schema as any });
}

type AppDatabase = ReturnType<typeof drizzleSqlite<typeof schema>>;

export const sqlite = sqliteClient;
export const sqlPg = pgClient;
export const db: AppDatabase = dbInstance;
